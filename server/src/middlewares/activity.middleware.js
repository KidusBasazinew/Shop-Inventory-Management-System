import {
  setRequestContext,
  getRequestContext,
  logActivityFireAndForget,
} from "../utils/activity.js";

/**
 * Global audit middleware.
 *
 * After the response finishes, write one ActivityEvent per request so the
 * platform owner can see exactly what every shop does in the software
 * (day-by-day usage, who made a mistake, what was deleted, logins, etc).
 *
 * - Auth routes themselves are logged (shopId unknown until they respond,
 *   so auth controllers call setRequestContext on success).
 * - Read-only GETs are logged with method/path only (no body) to keep the
 *   trail useful but small; writes also capture a body summary.
 * - Mutations record the response status + a compacted body summary.
 */
export default function activityAudit(req, res, next) {
  res.on("finish", () => {
    const ctx = getRequestContext(req);
    if (ctx.skipActivity) return;

    const isWrite = !["GET", "HEAD", "OPTIONS"].includes(req.method);
    let detail;
    if (isWrite && req.body && Object.keys(req.body).length) {
      // Never store secrets in the audit trail.
      const clone = { ...req.body };
      for (const k of ["password", "newPassword", "refreshToken", "token"]) {
        if (k in clone) clone[k] = "***";
      }
      detail = clone;
    }

    logActivityFireAndForget(req, {
      type: ctx.type ?? (isWrite ? `${ctx.module ?? "api"}.write` : `${ctx.module ?? "api"}.read`),
      method: req.method,
      path: req.originalUrl ?? req.url,
      statusCode: res.statusCode,
      detail,
    });
  });
  next();
}
