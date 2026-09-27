import prisma from "../lib/prisma.js";

/**
 * Remembers which shop/user a request came from so the activity
 * middleware can record an audit event. setContext must be called
 * AFTER authMiddleware (it needs req.user/req.shopId).
 */
const AUG = Symbol("activityContext");

export function setRequestContext(req, ctx) {
  req[AUG] = { ...req[AUG], ...ctx };
}

export function getRequestContext(req) {
  return req[AUG] ?? {};
}

/** Synchronous, never throws — audit logging must not break requests. */
export async function logActivity(req, entry = {}) {
  try {
    const { skipActivity, ...ctx } = getRequestContext(req);
    if (skipActivity || !ctx.shopId) return;
    const data = {
      shopId: ctx.shopId,
      userId: ctx.userId ?? null,
      type: entry.type ?? `${ctx.module ?? "app"}.unknown`,
      method: entry.method ?? req.method,
      path: entry.path ?? req.originalUrl ?? req.url,
      statusCode: entry.statusCode ?? null,
      detail: entry.detail ?? undefined,
    };
    await prisma.activityEvent.create({ data });
  } catch (err) {
    // Never let audit logging crash a business request.
    console.error("[activity] failed to record event:", err?.message);
  }
}

/**
 * Fire-and-forget helper for logging from services where req may not
 * exist (e.g. scheduler) or where we want to attach extra context.
 */
export function logActivityFireAndForget(req, entry) {
  if (!req) return;
  logActivity(req, entry).catch(() => {});
}

export default { setRequestContext, getRequestContext, logActivity };
