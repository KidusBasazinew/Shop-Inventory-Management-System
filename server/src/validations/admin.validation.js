import { z } from "zod";

export const shopIdParamSchema = z.object({
  id: z.string().min(1),
});

export const shopPaymentIdParamSchema = z.object({
  id: z.string().min(1),
});

export const outreachIdParamSchema = z.object({
  id: z.string().min(1),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(6).max(128),
});

export const adminCreateShopSchema = z.object({
  shopName: z.string().min(2).max(120),
  shopLocation: z.string().max(255).optional(),
  ownerName: z.string().min(2).max(120),
  phone: z.string().min(5).max(30),
  password: z.string().min(6).max(128),
});

export const adminToggleShopSchema = z.object({
  isActive: z.boolean(),
});

export const adminShopsQuerySchema = z.object({
  q: z.string().max(120).optional(),
  status: z
    .enum(["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "CANCELED"])
    .optional(),
  usage: z.enum(["active", "inactive"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const adminEventsQuerySchema = z.object({
  shopId: z.string().optional(),
  type: z.string().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional(),
});

export const adminPaymentsQuerySchema = z.object({
  status: z.enum(["PENDING", "AI_VERIFIED", "MANUAL_VERIFIED", "REJECTED"]).optional(),
});

export const adminReviewPaymentSchema = z.object({
  decision: z.enum(["MANUAL_VERIFIED", "REJECTED"]),
  note: z.string().max(500).optional(),
});

export const adminExtendSubscriptionSchema = z.object({
  days: z.coerce.number().int().min(1).max(366).optional(),
});

export const adminOutreachQuerySchema = z.object({
  status: z.enum(["PENDING", "DONE", "NO_ANSWER", "NOT_INTERESTED"]).optional(),
  shopId: z.string().optional(),
});

export const adminCreateOutreachSchema = z.object({
  shopId: z.string().optional(),
  phone: z.string().min(5).max(30),
  reason: z.enum([
    "INACTIVE_SHOP",
    "EXPIRED_SUBSCRIPTION",
    "APP_INSTALL_NO_USE",
    "SUPPORT",
    "OTHER",
  ]),
  channel: z.enum(["CALL", "SMS", "WHATSAPP"]).optional(),
  note: z.string().max(1000).optional(),
  followUpAt: z.coerce.date().optional(),
});

export const adminUpdateOutreachSchema = z.object({
  status: z.enum(["PENDING", "DONE", "NO_ANSWER", "NOT_INTERESTED"]),
  note: z.string().max(1000).optional(),
  followUpAt: z.coerce.date().nullable().optional(),
});

export const adminMarkNotificationReadSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});
