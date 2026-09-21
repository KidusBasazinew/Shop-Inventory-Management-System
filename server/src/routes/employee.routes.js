import { Router } from "express";

import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import subscriptionGuard from "../middlewares/subscription.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/employee.controller.js";
import {
  employeeIdParamSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesQuerySchema,
} from "../validations/employee.validation.js";
import {
  createPayrollPaymentSchema,
  listPayrollQuerySchema,
} from "../validations/payroll.validation.js";

const router = Router();

router.use(authMiddleware, subscriptionGuard, requireRole("OWNER", "MANAGER"));

router.get("/", validate({ query: listEmployeesQuerySchema }), controller.list);
router.get("/:id", validate({ params: employeeIdParamSchema }), controller.get);
router.post("/", validate({ body: createEmployeeSchema }), controller.create);
router.patch(
  "/:id",
  validate({ params: employeeIdParamSchema, body: updateEmployeeSchema }),
  controller.update,
);

router.get(
  "/:id/payroll",
  validate({ params: employeeIdParamSchema, query: listPayrollQuerySchema }),
  controller.listPayroll,
);
router.post(
  "/:id/payroll",
  validate({ params: employeeIdParamSchema, body: createPayrollPaymentSchema }),
  controller.createPayroll,
);

export default router;
