import { Router } from "express";

import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import subscriptionGuard from "../middlewares/subscription.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/expense.controller.js";
import {
  expenseIdParamSchema,
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
} from "../validations/expense.validation.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard);

router.get("/", validate({ query: listExpensesQuerySchema }), controller.list);
router.get("/:id", validate({ params: expenseIdParamSchema }), controller.get);
router.post(
  "/",
  requireRole("OWNER", "MANAGER"),
  validate({ body: createExpenseSchema }),
  controller.create,
);
router.patch(
  "/:id",
  requireRole("OWNER", "MANAGER"),
  validate({ params: expenseIdParamSchema, body: updateExpenseSchema }),
  controller.update,
);
router.delete(
  "/:id",
  requireRole("OWNER"),
  validate({ params: expenseIdParamSchema }),
  controller.remove,
);

export default router;
