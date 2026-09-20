import { Router } from "express";

import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import subscriptionGuard from "../middlewares/subscription.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as productController from "../controllers/product.controller.js";
import * as stockController from "../controllers/stock.controller.js";
import {
  productIdParamSchema,
  createProductSchema,
  updateProductSchema,
  listProductsQuerySchema,
} from "../validations/product.validation.js";
import {
  addStockSchema,
  removeStockSchema,
  adjustStockSchema,
  stockHistoryQuerySchema,
} from "../validations/stock.validation.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get(
  "/",
  validate({ query: listProductsQuerySchema }),
  productController.list,
);
router.get(
  "/:id",
  validate({ params: productIdParamSchema }),
  productController.get,
);
router.post(
  "/",
  requireRole("OWNER", "MANAGER"),
  validate({ body: createProductSchema }),
  productController.create,
);
router.patch(
  "/:id",
  requireRole("OWNER", "MANAGER"),
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  productController.update,
);
router.delete(
  "/:id",
  requireRole("OWNER", "MANAGER"),
  validate({ params: productIdParamSchema }),
  productController.deactivate,
);

// Stock actions
router.post(
  "/:id/stock/add",
  requireRole("OWNER", "MANAGER"),
  validate({ params: productIdParamSchema, body: addStockSchema }),
  stockController.add,
);
router.post(
  "/:id/stock/remove",
  requireRole("OWNER", "MANAGER"),
  validate({ params: productIdParamSchema, body: removeStockSchema }),
  stockController.remove,
);
router.post(
  "/:id/stock/adjust",
  requireRole("OWNER", "MANAGER"),
  validate({ params: productIdParamSchema, body: adjustStockSchema }),
  stockController.adjust,
);
router.get(
  "/:id/stock/history",
  validate({ params: productIdParamSchema, query: stockHistoryQuerySchema }),
  stockController.history,
);

export default router;
