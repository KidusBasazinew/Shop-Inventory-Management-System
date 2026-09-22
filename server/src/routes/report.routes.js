import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import subscriptionGuard from "../middlewares/subscription.middleware.js";
import * as controller from "../controllers/report.controller.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get("/dashboard", controller.dashboard);

export default router;
