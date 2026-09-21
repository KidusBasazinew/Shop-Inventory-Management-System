import catchAsync from "../utils/catchAsync.js";
import * as expenseService from "../services/expense.service.js";

export const list = catchAsync(async (req, res) => {
  const result = await expenseService.listExpenses(req.shopId, req.query);
  res.status(200).json(result);
});

export const get = catchAsync(async (req, res) => {
  const expense = await expenseService.getExpense(req.shopId, req.params.id);
  res.status(200).json(expense);
});

export const create = catchAsync(async (req, res) => {
  const expense = await expenseService.createExpense(req.shopId, req.body);
  res.status(201).json(expense);
});

export const update = catchAsync(async (req, res) => {
  const expense = await expenseService.updateExpense(
    req.shopId,
    req.params.id,
    req.body,
  );
  res.status(200).json(expense);
});

export const remove = catchAsync(async (req, res) => {
  await expenseService.deleteExpense(req.shopId, req.params.id);
  res.status(204).send();
});
