import { Router } from "express";

import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import subscriptionGuard from "../middlewares/subscription.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/tax.controller.js";
import {
  createTaxPaymentSchema,
  listTaxPaymentsQuerySchema,
  vatReportQuerySchema,
} from "../validations/tax.validation.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard, requireRole("OWNER", "MANAGER"));

router.get(
  "/payments",
  validate({ query: listTaxPaymentsQuerySchema }),
  controller.list,
);
router.post(
  "/payments",
  validate({ body: createTaxPaymentSchema }),
  controller.create,
);
router.get(
  "/vat-report",
  validate({ query: vatReportQuerySchema }),
  controller.vatReport,
);

export default router;
