import catchAsync from "../utils/catchAsync.js";
import * as reportService from "../services/report.service.js";

export const dashboard = catchAsync(async (req, res) => {
  const data = await reportService.getDashboard(req.shopId);
  res.status(200).json(data);
});
