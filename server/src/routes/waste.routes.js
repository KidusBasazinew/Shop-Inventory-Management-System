import { Router } from "express";

import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import subscriptionGuard from "../middlewares/subscription.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/waste.controller.js";
import {
  wasteIdParamSchema,
  createWasteSchema,
  listWasteQuerySchema,
} from "../validations/waste.validation.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get("/", validate({ query: listWasteQuerySchema }), controller.list);
router.get("/:id", validate({ params: wasteIdParamSchema }), controller.get);
router.post(
  "/",
  requireRole("OWNER", "MANAGER", "CASHIER", "EMPLOYEE"),
  validate({ body: createWasteSchema }),
  controller.create,
);

export default router;
