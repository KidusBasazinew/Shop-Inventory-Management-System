import catchAsync from "../utils/catchAsync.js";
import * as adminService from "../services/admin.service.js";

// ---- auth ----
export const adminLogin = catchAsync(async (req, res) => {
  const result = await adminService.adminLogin(req.body);
  res.status(200).json(result);
});

export const adminRefresh = catchAsync(async (req, res) => {
  const result = await adminService.adminRefresh(req.body);
  res.status(200).json(result);
});

export const adminMe = catchAsync(async (req, res) => {
  res.status(200).json({ user: req.user });
});

// ---- dashboard ----
export const overview = catchAsync(async (req, res) => {
  const data = await adminService.getOverview();
  res.status(200).json(data);
});

// ---- shops ----
export const listShops = catchAsync(async (req, res) => {
  const data = await adminService.listShops(req.query);
  res.status(200).json(data);
});

export const getShop = catchAsync(async (req, res) => {
  const data = await adminService.getShopDetail(req.params.id);
  res.status(200).json(data);
});

export const resetShopOwnerPassword = catchAsync(async (req, res) => {
  const result = await adminService.resetShopOwnerPassword(
    req.params.id,
    req.body.newPassword,
    req.user,
  );
  res.status(200).json(result);
});

export const extendSubscription = catchAsync(async (req, res) => {
  const data = await adminService.extendSubscription(
    req.params.id,
    req.body.days ?? 30,
    req.user,
  );
  res.status(200).json(data);
});

export const toggleShopActive = catchAsync(async (req, res) => {
  const data = await adminService.toggleShopActive(req.params.id, req.body, req.user);
  res.status(200).json(data);
});

// ---- subscription payments (review queue) ----
export const listPayments = catchAsync(async (req, res) => {
  const payments = await adminService.listPayments(req.query.status);
  res.status(200).json(payments);
});

export const getPayment = catchAsync(async (req, res) => {
  const payment = await adminService.getPayment(req.params.id);
  res.status(200).json(payment);
});

export const reviewPayment = catchAsync(async (req, res) => {
  const payment = await adminService.reviewPayment({
    id: req.params.id,
    adminUser: req.user,
    decision: req.body.decision,
    note: req.body.note,
  });
  res.status(200).json(payment);
});

/**
 * Screenshot delivery for the review queue / shop drilldown:
 *  - Cloudinary-hosted: 302 redirect to the CDN URL — the browser loads
 *    it straight from Cloudinary
 *  - local dev file:    streamed from the private uploads dir
 */
export const getPaymentScreenshot = catchAsync(async (req, res) => {
  const payment = await adminService.getPayment(req.params.id);
  if (payment.screenshotView) {
    return res.redirect(payment.screenshotView);
  }
  await adminService.streamPaymentScreenshot(req.params.id, res);
});

// ---- activity feed ----
export const listEvents = catchAsync(async (req, res) => {
  const data = await adminService.listEvents(req.query);
  res.status(200).json(data);
});

// ---- outreach ----
export const listOutreach = catchAsync(async (req, res) => {
  const data = await adminService.listOutreach(req.query);
  res.status(200).json(data);
});

export const createOutreach = catchAsync(async (req, res) => {
  const data = await adminService.createOutreach(req.body, req.user);
  res.status(201).json(data);
});

export const updateOutreach = catchAsync(async (req, res) => {
  const data = await adminService.updateOutreach(req.params.id, req.body, req.user);
  res.status(200).json(data);
});

export default {};
