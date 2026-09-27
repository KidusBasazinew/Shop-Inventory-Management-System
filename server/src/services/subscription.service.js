import path from "node:path";
import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";
import { UPLOADS_DIR } from "../config/upload.js";
import { env } from "../config/env.js";
import { createNotification } from "./notification.service.js";
import { aiVerifyScreenshot } from "./ai.service.js";

/**
 * Screenshot-based subscription flow
 * ----------------------------------
 * 1. Owner transfers the money manually (bank / telebirr / CBE birr…).
 * 2. Owner uploads a screenshot + plan + payer info via
 *    POST /subscription/payments (multipart, image only).
 * 3. Row lands in SubscriptionPayment with status PENDING and
 *    autoAiDueAt = now + 15 minutes.
 * 4. Platform owner reviews the queue at
 *    GET /admin/subscription-payments?status=PENDING, opens the
 *    screenshot and approves / rejects. Approve => the shop gains
 *    planMonths * 30 days, added on top of any remaining days.
 * 5. If nobody reviews within 15 minutes, the scheduler runs
 *    runAutoAiVerification() which tries the AI check once:
 *      - high-confidence pass => auto-approve
 *      - high-confidence fail => auto-reject
 *      - low confidence       => stays PENDING for a human
 * 6. Reminders: scheduler sends 3-day / 2-day / 1-day (last day)
 *    notifications before the subscription (or trial) ends. A
 *    Notification row per stage is the dedupe record.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function sanitizePayment(payment) {
  if (!payment) return payment;
  const { reviewedBy, ...rest } = payment;
  return {
    ...rest,
    reviewedBy: reviewedBy
      ? { id: reviewedBy.id, name: reviewedBy.name }
      : null,
  };
}

export function resolveScreenshotPath(filename) {
  const safe = path.basename(filename); // blocks ../../ traversal
  return path.join(UPLOADS_DIR, safe);
}

export async function getSubscriptionStatus(shopId) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      name: true,
      subscriptionStatus: true,
      trialEnd: true,
      subscriptionEnd: true,
    },
  });
  if (!shop) throw ApiError.notFound("Shop not found");

  const now = new Date();
  let daysRemaining = null;
  const end =
    shop.subscriptionStatus === "TRIAL" ? shop.trialEnd : shop.subscriptionEnd;
  if (end) {
    daysRemaining = Math.max(
      0,
      Math.ceil((end.getTime() - now.getTime()) / DAY_MS),
    );
  }

  const lastPending = await prisma.subscriptionPayment.findFirst({
    where: { shopId, status: "PENDING" },
    orderBy: { submittedAt: "desc" },
    select: { id: true, planMonths: true, amountEtb: true, submittedAt: true },
  });

  return {
    subscriptionStatus: shop.subscriptionStatus,
    trialEnd: shop.trialEnd,
    subscriptionEnd: shop.subscriptionEnd,
    daysRemaining,
    monthlyPriceEtb: env.billing.monthlyPriceEtb,
    pendingRequest: lastPending,
  };
}

export async function createPaymentRequest(shopId, req) {
  const { planMonths, payerName, payerPhone, bankReference } = req.body;
  const file = req.file;
  if (!file) throw ApiError.badRequest("Payment screenshot is required");

  // One open request at a time keeps the review queue honest.
  const open = await prisma.subscriptionPayment.findFirst({
    where: { shopId, status: "PENDING" },
    select: { id: true },
  });
  if (open) {
    throw ApiError.conflict(
      "You already have a payment under review. Please wait for it to be verified.",
    );
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { id: true },
  });
  if (!shop) throw ApiError.notFound("Shop not found");

  const amountEtb = (env.billing.monthlyPriceEtb * planMonths).toFixed(2);

  const payment = await prisma.subscriptionPayment.create({
    data: {
      shopId,
      planMonths,
      amountEtb,
      payerName: payerName ?? null,
      payerPhone: payerPhone ?? null,
      bankReference: bankReference ?? null,
      screenshotUrl: file.filename,
      autoAiDueAt: new Date(Date.now() + env.billing.autoAiMinutes * 60 * 1000),
    },
  });

  await createNotification({
    shopId,
    type: "PAYMENT_SUBMITTED",
    title: "Payment submitted",
    body: `We received your payment proof for ${planMonths} month${planMonths > 1 ? "s" : ""} (ETB ${amountEtb}). Verification usually takes a few minutes.`,
    severity: "info",
  });

  return sanitizePayment(payment);
}

export async function listMyPayments(shopId) {
  const payments = await prisma.subscriptionPayment.findMany({
    where: { shopId },
    orderBy: { submittedAt: "desc" },
    take: 50,
  });
  return payments.map(sanitizePayment);
}

/** Streams the screenshot back to the shop that uploaded it. */
export async function getMyScreenshotPath(shopId, paymentId) {
  const payment = await prisma.subscriptionPayment.findUnique({
    where: { id: paymentId },
  });
  if (!payment || payment.shopId !== shopId) {
    throw ApiError.notFound("Payment not found");
  }
  return resolveScreenshotPath(payment.screenshotUrl);
}

export function listPaymentsForAdmin(status) {
  return prisma.subscriptionPayment.findMany({
    where: status ? { status } : undefined,
    include: {
      shop: { select: { id: true, name: true, phone: true, ownerName: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
    orderBy: { submittedAt: "asc" }, // oldest first — FIFO review queue
    take: 200,
  });
}

export async function getPaymentForAdmin(id) {
  const payment = await prisma.subscriptionPayment.findUnique({
    where: { id },
    include: {
      shop: { select: { id: true, name: true, phone: true, ownerName: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });
  if (!payment) throw ApiError.notFound("Payment not found");
  return payment;
}

/**
 * Activate a shop's subscription for a payment. Shared by the manual
 * review path and the AI auto-approve path. Extends from the LATER of
 * (current end, now) so early renewals never lose paid days, and
 * clears this cycle's reminder notifications.
 */
async function activateSubscriptionForPayment(tx, payment) {
  const shop = await tx.shop.findUnique({
    where: { id: payment.shopId },
    select: { subscriptionEnd: true },
  });
  const base =
    shop?.subscriptionEnd && shop.subscriptionEnd > new Date()
      ? shop.subscriptionEnd
      : new Date();
  const newEnd = new Date(base.getTime() + payment.planMonths * 30 * DAY_MS);

  await tx.shop.update({
    where: { id: payment.shopId },
    data: {
      subscriptionStatus: "ACTIVE",
      subscriptionEnd: newEnd,
      lastReminderAt: null, // re-arm reminders for the next cycle
    },
  });
  // Clear this cycle's reminder notifications so the next cycle
  // gets fresh 3/2/1-day reminders instead of being deduped away.
  await tx.notification.deleteMany({
    where: {
      shopId: payment.shopId,
      type: {
        in: [
          "SUBSCRIPTION_REMINDER_3D",
          "SUBSCRIPTION_REMINDER_2D",
          "SUBSCRIPTION_REMINDER_1D",
        ],
      },
    },
  });
  return newEnd;
}

/**
 * Approve / reject. Approve activates the plan (30 days per month,
 * stacked on any remaining days).
 */
export async function reviewPayment({ id, adminUserId, decision, note }) {
  const payment = await prisma.subscriptionPayment.findUnique({
    where: { id },
  });
  if (!payment) throw ApiError.notFound("Payment not found");
  if (payment.status !== "PENDING") {
    throw ApiError.conflict(
      `This payment was already ${payment.status.toLowerCase().replace(/_/g, " ")}`,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.subscriptionPayment.update({
      where: { id },
      data: {
        status: decision,
        reviewedById: adminUserId ?? null,
        reviewNote: note ?? null,
        decidedAt: new Date(),
        autoAiDoneAt: payment.autoAiDoneAt ?? new Date(), // stop the 15-min AI timer
      },
    });

    if (decision === "MANUAL_VERIFIED") {
      await activateSubscriptionForPayment(tx, payment);
    }
    return p;
  });

  if (decision === "MANUAL_VERIFIED") {
    await createNotification({
      shopId: payment.shopId,
      type: "PAYMENT_VERIFIED",
      title: "Subscription activated 🎉",
      body: `Your ${payment.planMonths}-month subscription is now active. Thank you!`,
      severity: "success",
    });
  } else {
    await createNotification({
      shopId: payment.shopId,
      type: "PAYMENT_REJECTED",
      title: "Payment could not be verified",
      body:
        note ||
        "We could not verify your payment screenshot. Please contact support or submit a valid proof.",
      severity: "critical",
    });
  }

  return sanitizePayment(updated);
}

/**
 * 15-minute fallback: if the platform owner hasn't reviewed a PENDING
 * payment, run the AI verification once per payment.
 * aiVerifyScreenshot returns { verified, confidence, details }.
 * Confidence below autoAiThreshold leaves it PENDING for a human.
 */
export async function runAutoAiVerification() {
  const due = await prisma.subscriptionPayment.findMany({
    where: {
      status: "PENDING",
      autoAiDoneAt: null,
      autoAiDueAt: { lte: new Date() },
    },
    take: 20,
  });

  const results = [];
  for (const payment of due) {
    let outcome = { verified: false, confidence: 0, details: { error: "AI unavailable" } };
    try {
      outcome = await aiVerifyScreenshot(
        resolveScreenshotPath(payment.screenshotUrl),
        { amountEtb: Number(payment.amountEtb), planMonths: payment.planMonths },
      );
    } catch (err) {
      outcome = { verified: false, confidence: 0, details: { error: err?.message } };
    }

    const confident = outcome.confidence >= env.billing.autoAiThreshold;
    const shouldApprove = confident && outcome.verified;
    const shouldReject = confident && !outcome.verified;
    const status = shouldApprove ? "AI_VERIFIED" : shouldReject ? "REJECTED" : "PENDING";

    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: {
        status,
        aiVerified: outcome.verified,
        aiConfidence: String(outcome.confidence),
        aiDetails: outcome.details ?? undefined,
        autoAiDoneAt: new Date(),
        ...(shouldReject
          ? { decidedAt: new Date(), reviewNote: "Auto-rejected by AI verification" }
          : {}),
        ...(shouldApprove
          ? { decidedAt: new Date(), reviewNote: "Auto-approved by AI after 15 minutes" }
          : {}),
      },
    });

    if (shouldApprove) {
      await prisma.$transaction(async (tx) => {
        await activateSubscriptionForPayment(tx, payment);
      });
      await createNotification({
        shopId: payment.shopId,
        type: "PAYMENT_VERIFIED",
        title: "Subscription activated 🎉",
        body: `Your ${payment.planMonths}-month subscription is now active. Thank you!`,
        severity: "success",
      });
    } else if (shouldReject) {
      await createNotification({
        shopId: payment.shopId,
        type: "PAYMENT_REJECTED",
        title: "Payment could not be verified",
        body:
          outcome.details?.reason ||
          "Our automatic check could not verify your payment screenshot. Our team will review it manually.",
        severity: "critical",
      });
    }

    results.push({ id: payment.id, status, confidence: outcome.confidence });
  }
  return results;
}

/**
 * Renewal reminders: 3 days out, 2 days out, 1 day out (last day).
 * Dedupe = one Notification row per (shop, type): if a reminder with
 * the same type exists we never send it twice for the same cycle
 * (cleared by lastReminderAt reset on activation).
 */
export async function runSubscriptionReminders() {
  const now = new Date();
  const horizon = new Date(now.getTime() + 3 * DAY_MS);
  const shops = await prisma.shop.findMany({
    where: {
      subscriptionStatus: { in: ["ACTIVE", "TRIAL"] },
      OR: [
        { subscriptionEnd: { lte: horizon, gt: now } },
        { trialEnd: { lte: horizon, gt: now } },
      ],
    },
  });

  const sent = [];
  for (const shop of shops) {
    const end =
      shop.subscriptionStatus === "TRIAL" ? shop.trialEnd : shop.subscriptionEnd;
    if (!end) continue;
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / DAY_MS);
    const stage = daysLeft >= 3 ? "3D" : daysLeft === 2 ? "2D" : "1D";
    const type =
      daysLeft >= 3
        ? "SUBSCRIPTION_REMINDER_3D"
        : daysLeft === 2
          ? "SUBSCRIPTION_REMINDER_2D"
          : "SUBSCRIPTION_REMINDER_1D";

    const existing = await prisma.notification.findFirst({
      where: { shopId: shop.id, type },
      select: { id: true },
    });
    if (existing) continue; // already sent this stage

    await createNotification({
      shopId: shop.id,
      type,
      title:
        daysLeft === 1
          ? "Your subscription ends today!"
          : `Your subscription ends in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`,
      body:
        daysLeft === 1
          ? "This is the last day of your subscription. Send your payment and upload the screenshot to avoid losing access."
          : `Renew now — transfer ETB ${env.billing.monthlyPriceEtb} per month and upload the payment screenshot to keep your shop running.`,
      severity: daysLeft === 1 ? "critical" : "warning",
      payload: { daysLeft, subscriptionEnd: end },
    });

    await prisma.shop.update({
      where: { id: shop.id },
      data: { lastReminderAt: now },
    });

    sent.push({ shopId: shop.id, stage, daysLeft });
  }
  return sent;
}

/** Flips ACTIVE subscriptions past their end date to EXPIRED + notify. */
export async function runExpirySweep() {
  const now = new Date();
  const expired = await prisma.shop.findMany({
    where: { subscriptionStatus: "ACTIVE", subscriptionEnd: { lt: now } },
    select: { id: true },
  });

  for (const shop of expired) {
    await prisma.shop.update({
      where: { id: shop.id },
      data: { subscriptionStatus: "EXPIRED" },
    });
    await createNotification({
      shopId: shop.id,
      type: "SUBSCRIPTION_EXPIRED",
      title: "Subscription expired",
      body: "Your subscription has ended. Renew now to regain full access to your shop.",
      severity: "critical",
    });
  }
  return expired.map((s) => s.id);
}

/** Called once a payment is approved/rejected from any path. */
export function stopReminderStagesFor(shopId) {
  // Kept as a hook point — reminders dedupe by Notification rows, so
  // nothing to delete here; reset happens on activation via
  // lastReminderAt: null (see reviewPayment).
  return prisma.notification.deleteMany({
    where: {
      shopId,
      type: {
        in: [
          "SUBSCRIPTION_REMINDER_3D",
          "SUBSCRIPTION_REMINDER_2D",
          "SUBSCRIPTION_REMINDER_1D",
        ],
      },
    },
  });
}

export default {
  getSubscriptionStatus,
  createPaymentRequest,
  listMyPayments,
  getMyScreenshotPath,
  listPaymentsForAdmin,
  getPaymentForAdmin,
  reviewPayment,
  runAutoAiVerification,
  runSubscriptionReminders,
  runExpirySweep,
  resolveScreenshotPath,
};
