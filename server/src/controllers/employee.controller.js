import catchAsync from "../utils/catchAsync.js";
import * as employeeService from "../services/employee.service.js";
import * as payrollService from "../services/payroll.service.js";

export const list = catchAsync(async (req, res) => {
  const result = await employeeService.listEmployees(req.shopId, req.query);
  res.status(200).json(result);
});

export const get = catchAsync(async (req, res) => {
  const employee = await employeeService.getEmployee(req.shopId, req.params.id);
  res.status(200).json(employee);
});

export const create = catchAsync(async (req, res) => {
  const employee = await employeeService.createEmployee(req.shopId, req.body);
  res.status(201).json(employee);
});

export const update = catchAsync(async (req, res) => {
  const employee = await employeeService.updateEmployee(
    req.shopId,
    req.params.id,
    req.body,
  );
  res.status(200).json(employee);
});

export const listPayroll = catchAsync(async (req, res) => {
  const result = await payrollService.listPayrollPayments(
    req.shopId,
    req.params.id,
    req.query,
  );
  res.status(200).json(result);
});

export const createPayroll = catchAsync(async (req, res) => {
  const payment = await payrollService.recordPayrollPayment(
    req.shopId,
    req.params.id,
    req.body,
  );
  res.status(201).json(payment);
});
