import catchAsync from "../utils/catchAsync.js";
import * as productService from "../services/product.service.js";

export const list = catchAsync(async (req, res) => {
  const result = await productService.listProducts(req.shopId, req.query);
  res.status(200).json(result);
});

export const get = catchAsync(async (req, res) => {
  const product = await productService.getProduct(req.shopId, req.params.id);
  res.status(200).json(product);
});

export const create = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.shopId, req.body);
  res.status(201).json(product);
});

export const update = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(
    req.shopId,
    req.params.id,
    req.body,
  );
  res.status(200).json(product);
});

export const deactivate = catchAsync(async (req, res) => {
  await productService.deactivateProduct(req.shopId, req.params.id);
  res.status(204).send();
});
