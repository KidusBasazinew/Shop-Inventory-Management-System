import { verifyAccessToken } from "../wrapper/token.js";
import ApiError from "../utils/apiError.js";

/**
 * Admin (platform-owner) guard. Same JWT machinery as shops, but the
 * token must carry role: "ADMIN". ADMIN users have shopId = null —
 * they are not part of any tenant, so req.shopId stays undefined and
 * no tenant-scoped controller can ever be reached through this router.
 */
export function adminAuthMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing bearer token"));
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    if (payload.role !== "ADMIN") {
      return next(ApiError.forbidden("Admin access required"));
    }
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(ApiError.unauthorized("Access token expired"));
    }
    return next(ApiError.unauthorized("Invalid access token"));
  }
}

export default adminAuthMiddleware;
