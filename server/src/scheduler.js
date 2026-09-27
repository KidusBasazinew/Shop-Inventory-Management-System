import {
  runAutoAiVerification,
  runSubscriptionReminders,
  runExpirySweep,
} from "./services/subscription.service.js";
import { env } from "./config/env.js";

/**
 * Background scheduler (single setInterval loop):
 *  - every minute: subscription reminders (3/2/1 days out), expiry sweep
 *  - every minute: 15-minute AI fallback for unreviewed payments
 *
 * Started from index.js; guarded so nothing throws into the event loop.
 */
let timer = null;

async function tick() {
  try {
    await runExpirySweep();
  } catch (err) {
    console.error("[scheduler] expiry sweep failed:", err?.message);
  }

  try {
    const sent = await runSubscriptionReminders();
    if (sent.length) {
      console.info(`[scheduler] sent ${sent.length} subscription reminder(s)`);
    }
  } catch (err) {
    console.error("[scheduler] reminders failed:", err?.message);
  }

  try {
    const checked = await runAutoAiVerification();
    if (checked.length) {
      console.info(
        `[scheduler] AI fallback verified ${checked.length} payment(s)`,
      );
    }
  } catch (err) {
    console.error("[scheduler] AI fallback failed:", err?.message);
  }
}

export function startScheduler() {
  if (!env.billing.schedulerEnabled) {
    console.info("[scheduler] disabled via SCHEDULER_ENABLED=false");
    return;
  }
  if (timer) return;
  const intervalMs = Math.max(30, env.billing.schedulerIntervalSeconds) * 1000;
  timer = setInterval(() => {
    tick().catch((err) =>
      console.error("[scheduler] tick failed:", err?.message),
    );
  }, intervalMs);
  console.info(`[scheduler] running every ${intervalMs / 1000}s`);
}

export function stopScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}

export default { startScheduler, stopScheduler };
