import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";
import { hashPassword, comparePassword } from "../wrapper/password.js";
import { signAccessToken, generateRefreshToken, hashRefreshToken } from "../wrapper/token.js";

/**
 * Platform-owner (ADMIN) business logic. Admins are User rows with
 * role ADMIN living in the sentinel "__platform__" shop (User.shopId
 * is required), so password hashing, JWTs and refresh tokens reuse
 * the existing machinery untouched.
 */
export async function adminLogin({ email, password }) {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), role: "ADMIN" },
  });

  // Same message for unknown email / wrong password (no enumeration).
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  const accessToken = signAccessToken(user); // role ADMIN, shopId = platform sentinel
  const { raw, hash, expiresAt } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      shopId: user.shopId,
      userId: user.id,
      tokenHash: hash,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: raw,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

/**
 * Admin refresh-token rotation. Separate from shop auth because the
 * caller has no access token yet — we identify the ADMIN purely from
 * the stored refresh token.
 */
export async function adminRefresh({ refreshToken }) {
  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is invalid or expired");
  }
  if (stored.user.role !== "ADMIN" || !stored.user.isActive) {
    throw ApiError.unauthorized("Refresh token is invalid or expired");
  }

  const accessToken = signAccessToken(stored.user);
  const fresh = generateRefreshToken();

  // Rotate: revoke the presented token, issue a new pair.
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        shopId: stored.user.shopId,
        userId: stored.user.id,
        tokenHash: fresh.hash,
        expiresAt: fresh.expiresAt,
      },
    }),
  ]);

  return { accessToken, refreshToken: fresh.raw };
}

export async function getOverview() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Usage analytics exclude the "__platform__" sentinel shop that only
  // exists to host ADMIN accounts.
  const usageWhere = { shop: { name: { not: "__platform__" } } };

  const [
    totalShops,
    activeSubs,
    trialShops,
    expiredShops,
    pendingReviews,
    dau,
    wau,
    mau,
    revenueAgg,
    recentRevenueAgg,
    unreadNotifications,
  ] = await Promise.all([
    prisma.shop.count({ where: { name: { not: "__platform__" } } }),
    prisma.shop.count({ where: { subscriptionStatus: "ACTIVE", subscriptionEnd: { gt: now } } }),
    prisma.shop.count({ where: { subscriptionStatus: "TRIAL" } }),
    prisma.shop.count({ where: { subscriptionStatus: "EXPIRED" } }),
    prisma.subscriptionPayment.count({ where: { status: "PENDING" } }),
    prisma.appSession.count({ where: { ...usageWhere, day: { gte: dayAgo } } }),
    prisma.appSession.count({ where: { ...usageWhere, day: { gte: weekAgo } } }),
    prisma.appSession.count({ where: { ...usageWhere, day: { gte: monthAgo } } }),
    prisma.subscriptionPayment.aggregate({
      where: { status: { in: ["AI_VERIFIED", "MANUAL_VERIFIED"] } },
      _sum: { amountEtb: true },
      _count: true,
    }),
    prisma.subscriptionPayment.aggregate({
      where: { status: { in: ["AI_VERIFIED", "MANUAL_VERIFIED"] }, decidedAt: { gte: monthAgo } },
      _sum: { amountEtb: true },
      _count: true,
    }),
    prisma.notification.count({ where: { isRead: false } }),
  ]);

  // Last 30 days of daily active shops for the chart.
  const sessions = await prisma.appSession.findMany({
    where: { ...usageWhere, day: { gte: monthAgo } },
    select: { day: true },
  });
  const byDay = new Map();
  for (const s of sessions) {
    const key = s.day.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  const usageChart = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    usageChart.push({ day: key, shops: byDay.get(key) ?? 0 });
  }

  return {
    shops: { total: totalShops, active: activeSubs, trial: trialShops, expired: expiredShops },
    usage: { dau, wau, mau, usageChart },
    revenue: {
      totalEtb: Number(revenueAgg._sum.amountEtb ?? 0),
      totalPayments: revenueAgg._count,
      last30dEtb: Number(recentRevenueAgg._sum.amountEtb ?? 0),
      last30dPayments: recentRevenueAgg._count,
    },
    pendingReviews,
    unreadNotifications,
  };
}

export async function listShops({ q, status, usage, page = 1, pageSize = 20 }) {
  const where = { name: { not: "__platform__" } };
  if (status) where.subscriptionStatus = status;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { ownerName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const shops = await prisma.shop.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      ownerName: true,
      location: true,
      subscriptionStatus: true,
      trialEnd: true,
      subscriptionEnd: true,
      createdAt: true,
      users: { select: { id: true, name: true, role: true, isActive: true } },
      appSessions: {
        where: { day: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
        select: { day: true },
      },
      _count: { select: { activityEvents: true, subscriptionPayments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  let rows = shops.map((shop) => {
    const days30 = new Set(shop.appSessions.map((s) => s.day.toISOString().slice(0, 10))).size;
    const lastSeen = shop.appSessions.reduce(
      (acc, s) => (s.day > acc ? s.day : acc),
      null,
    );
    const activeToday = shop.appSessions.some(
      (s) => s.day.toISOString().slice(0, 10) === now.toISOString().slice(0, 10),
    );
    return {
      id: shop.id,
      name: shop.name,
      phone: shop.phone,
      ownerName: shop.ownerName,
      location: shop.location,
      subscriptionStatus: shop.subscriptionStatus,
      trialEnd: shop.trialEnd,
      subscriptionEnd: shop.subscriptionEnd,
      createdAt: shop.createdAt,
      usersCount: shop.users.length,
      users: shop.users,
      activeDaysLast30: days30,
      activeToday,
      lastSeenAt: lastSeen,
      activityCount: shop._count.activityEvents,
      paymentsCount: shop._count.subscriptionPayments,
    };
  });

  if (usage === "active") rows = rows.filter((r) => r.activeDaysLast30 >= 5);
  if (usage === "inactive") rows = rows.filter((r) => r.activeDaysLast30 < 5);

  const total = rows.length;
  const start = (page - 1) * pageSize;
  return { total, page, pageSize, shops: rows.slice(start, start + pageSize) };
}

export async function getShopDetail(shopId) {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: {
      users: { select: { id: true, name: true, phone: true, email: true, role: true, isActive: true, createdAt: true } },
      subscriptionPayments: { orderBy: { submittedAt: "desc" }, take: 20 },
      _count: {
        select: {
          products: true,
          sales: true,
          purchases: true,
          customers: true,
          suppliers: true,
          employees: true,
          stockMovements: true,
          wasteRecords: true,
        },
      },
    },
  });
  if (!shop) throw ApiError.notFound("Shop not found");

  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [sessions, recentEvents] = await Promise.all([
    prisma.appSession.findMany({ where: { shopId, day: { gte: monthAgo } }, orderBy: { day: "asc" } }),
    prisma.activityEvent.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { user: { select: { name: true, role: true } } },
    }),
  ]);

  const { appSessions, subscriptionPayments, ...shopBase } = shop;
  const { decoratePayment } = await import("./subscription.service.js");
  return {
    shop: shopBase,
    counts: shop._count,
    usage: sessions.map((s) => ({
      day: s.day,
      requestCount: s.requestCount,
      deviceName: s.deviceName,
      osName: s.osName,
      appVersion: s.appVersion,
    })),
    recentEvents,
    subscriptionPayments: subscriptionPayments.map(decoratePayment),
  };
}

export async function resetShopOwnerPassword(shopId, newPassword, adminUser) {
  const owner = await prisma.user.findFirst({
    where: { shopId, role: "OWNER" },
  });
  if (!owner) throw ApiError.notFound("Shop owner not found");

  const passwordHash = await hashPassword(newPassword);
  const [user] = await prisma.$transaction([
    prisma.user.update({ where: { id: owner.id }, data: { passwordHash } }),
    // Kicking every session forces a fresh login with the new password.
    prisma.refreshToken.updateMany({
      where: { userId: owner.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  await prisma.activityEvent.create({
    data: {
      shopId,
      userId: null,
      type: "admin.resetOwnerPassword",
      detail: { adminId: adminUser?.userId ?? null, targetUserId: owner.id },
    },
  });

  return { userId: user.id, message: "Owner password reset. All sessions were logged out." };
}

export async function extendSubscription(shopId, days, adminUser) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw ApiError.notFound("Shop not found");

  const base =
    shop.subscriptionEnd && shop.subscriptionEnd > new Date()
      ? shop.subscriptionEnd
      : new Date();
  const newEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  const updated = await prisma.$transaction([
    prisma.shop.update({
      where: { id: shopId },
      data: { subscriptionStatus: "ACTIVE", subscriptionEnd: newEnd, lastReminderAt: null },
    }),
    // Re-arm reminder stages for the new cycle.
    prisma.notification.deleteMany({
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
    }),
  ]);

  await prisma.activityEvent.create({
    data: {
      shopId,
      type: "admin.extendSubscription",
      detail: { adminId: adminUser?.userId ?? null, days, newEnd },
    },
  });

  return updated;
}

export async function toggleShopActive(shopId, { isActive }, adminUser) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw ApiError.notFound("Shop not found");

  await prisma.$transaction([
    prisma.user.updateMany({ where: { shopId }, data: { isActive } }),
    ...(isActive
      ? []
      : [
          prisma.refreshToken.updateMany({
            where: { shopId, revokedAt: null },
            data: { revokedAt: new Date() },
          }),
        ]),
  ]);

  await prisma.activityEvent.create({
    data: {
      shopId,
      type: isActive ? "admin.activateShop" : "admin.deactivateShop",
      detail: { adminId: adminUser?.userId ?? null },
    },
  });

  return { shopId, isActive };
}

// thin wrappers around the subscription service for the queue —
// decorated with screenshotView (Cloudinary URL) for the dashboard
export async function listPayments(status) {
  const { listPaymentsForAdmin, decoratePayment } = await import(
    "./subscription.service.js"
  );
  const payments = await listPaymentsForAdmin(status);
  return payments.map(decoratePayment);
}

export async function getPayment(id) {
  const { getPaymentForAdmin, decoratePayment } = await import(
    "./subscription.service.js"
  );
  return decoratePayment(await getPaymentForAdmin(id));
}

export async function reviewPayment({ id, adminUser, decision, note }) {
  const { reviewPayment } = await import("./subscription.service.js");
  return reviewPayment({ id, adminUserId: adminUser?.userId, decision, note });
}

export async function streamPaymentScreenshot(id, res) {
  const fs = await import("node:fs");
  const { getPaymentForAdmin, resolveScreenshotPath } = await import(
    "./subscription.service.js"
  );
  const payment = await getPaymentForAdmin(id);
  if (/^https?:\/\//.test(payment.screenshotUrl ?? "")) {
    // Cloudinary-hosted: the dashboard renders the URL directly;
    // no local file to stream.
    throw ApiError.badRequest("Screenshot is hosted remotely");
  }
  const filePath = resolveScreenshotPath(payment.screenshotUrl);
  if (!fs.existsSync(filePath)) {
    throw ApiError.notFound("Screenshot file not found");
  }
  res.sendFile(filePath);
}

export async function listEvents({ shopId, type, limit = 50, cursor }) {
  const events = await prisma.activityEvent.findMany({
    where: {
      ...(shopId ? { shopId } : {}),
      ...(type ? { type: { contains: type } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 200),
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      shop: { select: { id: true, name: true } },
      user: { select: { id: true, name: true, role: true } },
    },
  });
  const nextCursor = events.length === Math.min(limit, 200) ? events[events.length - 1].id : null;
  return { events, nextCursor };
}

export async function listOutreach({ status, shopId }) {
  return prisma.outreachLog.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(shopId ? { shopId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      shop: { select: { id: true, name: true, phone: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function createOutreach(data, adminUser) {
  const log = await prisma.outreachLog.create({
    data: {
      shopId: data.shopId ?? null,
      phone: data.phone,
      reason: data.reason,
      channel: data.channel ?? "CALL",
      note: data.note ?? null,
      followUpAt: data.followUpAt ?? null,
      createdById: adminUser.userId,
    },
  });
  return log;
}

export async function updateOutreach(id, data, adminUser) {
  const existing = await prisma.outreachLog.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Outreach log not found");
  return prisma.outreachLog.update({
    where: { id },
    data: {
      status: data.status ?? undefined,
      note: data.note ?? undefined,
      followUpAt: data.followUpAt === null ? null : (data.followUpAt ?? undefined),
      resolvedAt: data.status && ["DONE", "NOT_INTERESTED"].includes(data.status) ? new Date() : undefined,
    },
  });
}
