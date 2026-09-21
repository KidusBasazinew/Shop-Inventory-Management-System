import { Router } from "express";

import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import subscriptionGuard from "../middlewares/subscription.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/payment.controller.js";
import {
  paymentIdParamSchema,
  createCustomerPaymentSchema,
  createSupplierPaymentSchema,
  listPaymentsQuerySchema,
} from "../validations/payment.validation.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get("/", validate({ query: listPaymentsQuerySchema }), controller.list);
router.get("/:id", validate({ params: paymentIdParamSchema }), controller.get);
router.post(
  "/customer",
  requireRole("OWNER", "MANAGER", "CASHIER"),
  validate({ body: createCustomerPaymentSchema }),
  controller.createCustomerPayment,
);
router.post(
  "/supplier",
  requireRole("OWNER", "MANAGER"),
  validate({ body: createSupplierPaymentSchema }),
  controller.createSupplierPayment,
);

export default router;
