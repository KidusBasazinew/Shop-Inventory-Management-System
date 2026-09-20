import { Router } from "express";

import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/shop.controller.js";
import { updateShopSchema } from "../validations/shop.validation.js";

const router = Router();

router.use(authMiddleware);

// Deliberately NOT behind subscriptionGuard — an owner with an expired
// subscription still needs to see their shop's status and settings.
router.get("/", controller.getShop);
router.patch(
  "/",
  requireRole("OWNER"),
  validate({ body: updateShopSchema }),
  controller.updateShop,
);

export default router;
