import catchAsync from "../utils/catchAsync.js";
import * as purchaseService from "../services/purchase.service.js";

export const list = catchAsync(async (req, res) => {
  const result = await purchaseService.listPurchases(req.shopId, req.query);
  res.status(200).json(result);
});

export const get = catchAsync(async (req, res) => {
  const purchase = await purchaseService.getPurchase(req.shopId, req.params.id);
  res.status(200).json(purchase);
});

export const create = catchAsync(async (req, res) => {
  const purchase = await purchaseService.createPurchase(req.shopId, req.body);
  res.status(201).json(purchase);
});
