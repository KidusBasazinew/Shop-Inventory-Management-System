import catchAsync from "../utils/catchAsync.js";
import * as stockService from "../services/stock.service.js";

export const add = catchAsync(async (req, res) => {
  const product = await stockService.addStock(
    req.shopId,
    req.params.id,
    req.body,
    req.user.userId,
  );
  res.status(200).json(product);
});

export const remove = catchAsync(async (req, res) => {
  const product = await stockService.removeStock(
    req.shopId,
    req.params.id,
    req.body,
    req.user.userId,
  );
  res.status(200).json(product);
});

export const adjust = catchAsync(async (req, res) => {
  const product = await stockService.adjustStock(
    req.shopId,
    req.params.id,
    req.body,
    req.user.userId,
  );
  res.status(200).json(product);
});

export const history = catchAsync(async (req, res) => {
  const result = await stockService.getStockHistory(
    req.shopId,
    req.params.id,
    req.query,
  );
  res.status(200).json(result);
});
