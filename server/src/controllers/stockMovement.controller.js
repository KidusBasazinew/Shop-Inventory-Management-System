import catchAsync from "../utils/catchAsync.js";
import * as stockMovementService from "../services/stockMovement.service.js";

export const list = catchAsync(async (req, res) => {
  const result = await stockMovementService.listStockMovements(
    req.shopId,
    req.query,
  );
  res.status(200).json(result);
});
