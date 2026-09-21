import catchAsync from "../utils/catchAsync.js";
import * as paymentService from "../services/payment.service.js";

export const list = catchAsync(async (req, res) => {
  const result = await paymentService.listPayments(req.shopId, req.query);
  res.status(200).json(result);
});

export const get = catchAsync(async (req, res) => {
  const payment = await paymentService.getPayment(req.shopId, req.params.id);
  res.status(200).json(payment);
});

export const createCustomerPayment = catchAsync(async (req, res) => {
  const payment = await paymentService.recordCustomerPayment(
    req.shopId,
    req.body,
  );
  res.status(201).json(payment);
});

export const createSupplierPayment = catchAsync(async (req, res) => {
  const payment = await paymentService.recordSupplierPayment(
    req.shopId,
    req.body,
  );
  res.status(201).json(payment);
});
