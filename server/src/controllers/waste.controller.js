import catchAsync from "../utils/catchAsync.js";
import * as wasteService from "../services/waste.service.js";

export const list = catchAsync(async (req, res) => {
  const result = await wasteService.listWaste(req.shopId, req.query);
  res.status(200).json(result);
});

export const get = catchAsync(async (req, res) => {
  const record = await wasteService.getWasteRecord(req.shopId, req.params.id);
  res.status(200).json(record);
});

export const create = catchAsync(async (req, res) => {
  const record = await wasteService.createWasteRecord(
    req.shopId,
    req.body,
    req.user.userId,
  );
  res.status(201).json(record);
});
