import prisma from "../lib/prisma.js";

/**
 * Usage heartbeat — "is this shop actually using the software?"
 *
 * Called by the global audit middleware (one upsert per request, or at
 * most once a minute per shop thanks to the cache). One row per
 * shop per UTC day in AppSession gives clean "daily active shops"
 * analytics for the platform owner, including device/app version.
 */
const recentCache = new Map(); // shopId -> { day, at }
const CACHE_MS = 60 * 1000; // record at most once per minute per shop

function utcDay(date = new Date()) {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  return d;
}

export async function recordUsage({ shopId, userId, req }) {
  try {
    const day = utcDay();
    const cached = recentCache.get(shopId);
    if (cached && cached.day === day && Date.now() - cached.at < CACHE_MS) {
      return; // throttled — same shop, same day, seen recently
    }
    recentCache.set(shopId, { day, at: Date.now() });

    await prisma.appSession.upsert({
      where: { shopId_day: { shopId, day } },
      create: {
        shopId,
        userId: userId ?? null,
        day,
        deviceName: req?.headers?.["x-device-name"] ?? null,
        osName: req?.headers?.["x-os-name"] ?? null,
        appVersion: req?.headers?.["x-app-version"] ?? null,
        requestCount: 1,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
      update: {
        requestCount: { increment: 1 },
        lastSeenAt: new Date(),
        userId: userId ?? undefined,
      },
    });
  } catch (err) {
    // Usage analytics must never break a business request.
    console.error("[usage] heartbeat failed:", err?.message);
  }
}

export function recordUsageFireAndForget(args) {
  recordUsage(args).catch(() => {});
}

export default { recordUsage, recordUsageFireAndForget };
