import catchAsync from "../utils/catchAsync.js";
import * as supplierService from "../services/supplier.service.js";

export const list = catchAsync(async (req, res) => {
  const result = await supplierService.listSuppliers(req.shopId, req.query);
  res.status(200).json(result);
});

export const get = catchAsync(async (req, res) => {
  const supplier = await supplierService.getSupplier(req.shopId, req.params.id);
  res.status(200).json(supplier);
});

export const create = catchAsync(async (req, res) => {
  const supplier = await supplierService.createSupplier(req.shopId, req.body);
  res.status(201).json(supplier);
});

export const update = catchAsync(async (req, res) => {
  const supplier = await supplierService.updateSupplier(
    req.shopId,
    req.params.id,
    req.body,
  );
  res.status(200).json(supplier);
});
