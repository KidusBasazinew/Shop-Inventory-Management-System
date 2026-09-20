import { Router } from "express";

import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import subscriptionGuard from "../middlewares/subscription.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/purchase.controller.js";
import {
  purchaseIdParamSchema,
  createPurchaseSchema,
  listPurchasesQuerySchema,
} from "../validations/purchase.validation.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get("/", validate({ query: listPurchasesQuerySchema }), controller.list);
router.get("/:id", validate({ params: purchaseIdParamSchema }), controller.get);
router.post(
  "/",
  requireRole("OWNER", "MANAGER"),
  validate({ body: createPurchaseSchema }),
  controller.create,
);

export default router;
