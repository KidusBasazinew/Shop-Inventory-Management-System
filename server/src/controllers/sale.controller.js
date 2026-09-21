import catchAsync from "../utils/catchAsync.js";
import * as saleService from "../services/sale.service.js";

export const list = catchAsync(async (req, res) => {
  const result = await saleService.listSales(req.shopId, req.query);
  res.status(200).json(result);
});

export const get = catchAsync(async (req, res) => {
  const sale = await saleService.getSale(req.shopId, req.params.id);
  res.status(200).json(sale);
});

export const create = catchAsync(async (req, res) => {
  const sale = await saleService.createSale(
    req.shopId,
    req.body,
    req.user.userId,
  );
  res.status(201).json(sale);
});
