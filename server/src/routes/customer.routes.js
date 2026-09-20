import { Router } from "express";

import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import subscriptionGuard from "../middlewares/subscription.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/customer.controller.js";
import {
  customerIdParamSchema,
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
} from "../validations/customer.validation.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get("/", validate({ query: listCustomersQuerySchema }), controller.list);
router.get("/:id", validate({ params: customerIdParamSchema }), controller.get);
router.post(
  "/",
  requireRole("OWNER", "MANAGER", "CASHIER"),
  validate({ body: createCustomerSchema }),
  controller.create,
);
router.patch(
  "/:id",
  requireRole("OWNER", "MANAGER"),
  validate({ params: customerIdParamSchema, body: updateCustomerSchema }),
  controller.update,
);

export default router;
