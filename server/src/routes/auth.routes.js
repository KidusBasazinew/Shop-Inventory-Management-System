import { Router } from "express";
import rateLimit from "express-rate-limit";

import validate from "../middlewares/validate.middleware.js";
import {
  register,
  login,
  refresh,
  logout,
} from "../controllers/auth.controller.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "../validations/auth.validation.js";

export const authRouter = Router();

// Brute-force protection on the two endpoints that accept a password.
// Keyed by IP; swap for a Redis store (rate-limit-redis) once you run
// more than one instance behind a load balancer.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

authRouter.post(
  "/register",
  authLimiter,
  validate({ body: registerSchema }),
  register,
);
authRouter.post("/login", authLimiter, validate({ body: loginSchema }), login);
authRouter.post("/refresh", validate({ body: refreshSchema }), refresh);
authRouter.post("/logout", validate({ body: refreshSchema }), logout);

export default authRouter;
