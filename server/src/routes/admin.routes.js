import { Router } from "express";

import { adminAuthMiddleware } from "../middlewares/adminAuth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import * as controller from "../controllers/admin.controller.js";
import {
  adminLoginSchema,
  adminResetPasswordSchema,
  adminCreateShopSchema,
  adminToggleShopSchema,
  adminShopsQuerySchema,
  adminEventsQuerySchema,
  adminPaymentsQuerySchema,
  adminReviewPaymentSchema,
  adminExtendSubscriptionSchema,
  adminOutreachQuerySchema,
  adminCreateOutreachSchema,
  adminUpdateOutreachSchema,
  shopIdParamSchema,
  shopPaymentIdParamSchema,
  outreachIdParamSchema,
} from "../validations/admin.validation.js";

const router = Router();

// ---------- platform-owner auth (email + password) ----------
router.post(
  "/login",
  validate({ body: adminLoginSchema }),
  controller.adminLogin,
);
router.post("/refresh", controller.adminRefresh);
router.get("/me", adminAuthMiddleware, controller.adminMe);

// ---------- everything below requires an ADMIN session ----------
router.use(adminAuthMiddleware);

// Dashboard overview: totals, revenue, usage, review-queue depth
router.get("/overview", controller.overview);

// Shops: search, usage filters, per-shop drilldown
router.get("/shops", validate({ query: adminShopsQuerySchema }), controller.listShops);
router.get("/shops/:id", validate({ params: shopIdParamSchema }), controller.getShop);

// Account recovery: "forgot password" => admin sets a new one
router.patch(
  "/shops/:id/reset-owner-password",
  validate({ params: shopIdParamSchema, body: adminResetPasswordSchema }),
  controller.resetShopOwnerPassword,
);

// Give a shop more days manually (goodwill / support)
router.patch(
  "/shops/:id/extend",
  validate({ params: shopIdParamSchema, body: adminExtendSubscriptionSchema }),
  controller.extendSubscription,
);

// Deactivate / reactivate a shop account
router.patch(
  "/shops/:id/active",
  validate({ params: shopIdParamSchema, body: adminToggleShopSchema }),
  controller.toggleShopActive,
);

// Subscription payment review queue (screenshots)
router.get(
  "/subscription-payments",
  validate({ query: adminPaymentsQuerySchema }),
  controller.listPayments,
);
router.get(
  "/subscription-payments/:id",
  validate({ params: shopPaymentIdParamSchema }),
  controller.getPayment,
);
router.patch(
  "/subscription-payments/:id/review",
  validate({ params: shopPaymentIdParamSchema, body: adminReviewPaymentSchema }),
  controller.reviewPayment,
);
router.get(
  "/subscription-payments/:id/screenshot",
  validate({ params: shopPaymentIdParamSchema }),
  controller.getPaymentScreenshot,
);

// Full "what is every shop doing" activity feed
router.get("/events", validate({ query: adminEventsQuerySchema }), controller.listEvents);

// Outreach call/SMS log (inactive shops, expired subs, app-store installs)
router.get(
  "/outreach",
  validate({ query: adminOutreachQuerySchema }),
  controller.listOutreach,
);
router.post("/outreach", validate({ body: adminCreateOutreachSchema }), controller.createOutreach);
router.patch(
  "/outreach/:id",
  validate({ params: outreachIdParamSchema, body: adminUpdateOutreachSchema }),
  controller.updateOutreach,
);

export default router;
