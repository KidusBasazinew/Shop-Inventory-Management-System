import fs from "node:fs";
import catchAsync from "../utils/catchAsync.js";
import * as subscriptionService from "../services/subscription.service.js";

export const getStatus = catchAsync(async (req, res) => {
  const status = await subscriptionService.getSubscriptionStatus(req.shopId);
  res.status(200).json(status);
});

export const submitPayment = catchAsync(async (req, res) => {
  const payment = await subscriptionService.createPaymentRequest(req.shopId, req);
  res.status(201).json(payment);
});

export const listMyPayments = catchAsync(async (req, res) => {
  const payments = await subscriptionService.listMyPayments(req.shopId);
  res.status(200).json(payments);
});

export const getMyScreenshot = catchAsync(async (req, res) => {
  const filePath = await subscriptionService.getMyScreenshotPath(
    req.shopId,
    req.params.id,
  );
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Screenshot file not found" });
  }
  res.sendFile(filePath);
});

export default { getStatus, submitPayment, listMyPayments, getMyScreenshot };
