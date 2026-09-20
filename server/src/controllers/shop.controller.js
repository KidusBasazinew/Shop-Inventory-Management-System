import catchAsync from "../utils/catchAsync.js";
import * as shopService from "../services/shop.service.js";

export const getShop = catchAsync(async (req, res) => {
  const shop = await shopService.getShop(req.shopId);
  res.status(200).json(shop);
});

export const updateShop = catchAsync(async (req, res) => {
  const shop = await shopService.updateShop(req.shopId, req.body);
  res.status(200).json(shop);
});
