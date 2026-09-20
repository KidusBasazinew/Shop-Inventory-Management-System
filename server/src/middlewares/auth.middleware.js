import { verifyAccessToken } from "../wrapper/token.js";
import ApiError from "../utils/apiError.js";

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing bearer token"));
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = verifyAccessToken(token); // { userId, shopId, role, iat, exp }
    req.user = payload;
    // req.shopId is the ONLY source of tenant scoping used by controllers.
    // It is never read from req.body/req.query — that is what prevents a
    // caller from passing someone else's shopId to reach their data.
    req.shopId = payload.shopId;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(ApiError.unauthorized("Access token expired"));
    }
    return next(ApiError.unauthorized("Invalid access token"));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden("You do not have permission to perform this action"),
      );
    }
    next();
  };
}

export { authMiddleware, requireRole };
