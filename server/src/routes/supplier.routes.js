import { Router } from "express";

import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import subscriptionGuard from "../middlewares/subscription.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/supplier.controller.js";
import {
  supplierIdParamSchema,
  createSupplierSchema,
  updateSupplierSchema,
  listSuppliersQuerySchema,
} from "../validations/supplier.validation.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get("/", validate({ query: listSuppliersQuerySchema }), controller.list);
router.get("/:id", validate({ params: supplierIdParamSchema }), controller.get);
router.post(
  "/",
  requireRole("OWNER", "MANAGER"),
  validate({ body: createSupplierSchema }),
  controller.create,
);
router.patch(
  "/:id",
  requireRole("OWNER", "MANAGER"),
  validate({ params: supplierIdParamSchema, body: updateSupplierSchema }),
  controller.update,
);

export default router;
