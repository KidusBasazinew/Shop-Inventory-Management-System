import { Router } from "express";

import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import uploadScreenshot from "../middlewares/uploads.middleware.js";
import * as controller from "../controllers/subscription.controller.js";
import {
  requestSubscriptionSchema,
  subscriptionPaymentIdParamSchema,
} from "../validations/subscription.validation.js";

const router = Router();

router.use(authMiddleware);

// Deliberately NOT behind subscriptionGuard — an expired shop must
// still be able to see its status and submit a renewal payment.
router.get("/status", controller.getStatus);

// Multipart upload: screenshot image + planMonths/payer fields.
// Owner-only, like the rest of billing.
router.post(
  "/payments",
  requireRole("OWNER"),
  uploadScreenshot,
  validate({ body: requestSubscriptionSchema }),
  controller.submitPayment,
);

router.get("/payments", controller.listMyPayments);

// Owner can re-open their own uploaded screenshot.
router.get(
  "/payments/:id/screenshot",
  validate({ params: subscriptionPaymentIdParamSchema }),
  controller.getMyScreenshot,
);

export default router;
