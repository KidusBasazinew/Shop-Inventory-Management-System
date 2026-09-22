import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import subscriptionGuard from "../middlewares/subscription.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/stockMovement.controller.js";
import { listStockMovementsQuerySchema } from "../validations/stockMovement.validation.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get(
  "/",
  validate({ query: listStockMovementsQuerySchema }),
  controller.list,
);

export default router;
