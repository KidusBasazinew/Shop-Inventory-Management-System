import catchAsync from "../utils/catchAsync.js";
import * as customerService from "../services/customer.service.js";

export const list = catchAsync(async (req, res) => {
  const result = await customerService.listCustomers(req.shopId, req.query);
  res.status(200).json(result);
});

export const get = catchAsync(async (req, res) => {
  const customer = await customerService.getCustomer(req.shopId, req.params.id);
  res.status(200).json(customer);
});

export const create = catchAsync(async (req, res) => {
  const customer = await customerService.createCustomer(req.shopId, req.body);
  res.status(201).json(customer);
});

export const update = catchAsync(async (req, res) => {
  const customer = await customerService.updateCustomer(
    req.shopId,
    req.params.id,
    req.body,
  );
  res.status(200).json(customer);
});
