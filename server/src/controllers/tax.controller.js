import catchAsync from "../utils/catchAsync.js";
import * as taxService from "../services/tax.service.js";

export const list = catchAsync(async (req, res) => {
  const result = await taxService.listTaxPayments(req.shopId, req.query);
  res.status(200).json(result);
});

export const create = catchAsync(async (req, res) => {
  const payment = await taxService.createTaxPayment(req.shopId, req.body);
  res.status(201).json(payment);
});

export const vatReport = catchAsync(async (req, res) => {
  const report = await taxService.getVatReport(req.shopId, req.query);
  res.status(200).json(report);
});
