import { Router } from "express";

import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import subscriptionGuard from "../middlewares/subscription.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/sale.controller.js";
import {
  saleIdParamSchema,
  createSaleSchema,
  listSalesQuerySchema,
} from "../validations/sale.validation.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get("/", validate({ query: listSalesQuerySchema }), controller.list);
router.get("/:id", validate({ params: saleIdParamSchema }), controller.get);
router.post(
  "/",
  requireRole("OWNER", "MANAGER", "CASHIER"),
  validate({ body: createSaleSchema }),
  controller.create,
);

export default router;
