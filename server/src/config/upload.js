import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";

/**
 * Upload storage for subscription payment screenshots.
 *
 * Files are stored OUTSIDE public web access on purpose: a payment
 * screenshot is sensitive (bank/receipt details). The only way to view
 * one is through GET /api/v1/admin/subscription-payments/:id/screenshot
 * which streams it after ADMIN auth (the shop owner reads their own
 * uploads through /api/v1/subscription/payments/mine/:id/screenshot).
 *
 * The filename is random (no user-controlled path), and we keep only
 * images under a hard size cap — see uploads.middleware.js.
 */
export const UPLOADS_DIR = path.resolve(
  process.env.VERCEL
    ? path.join(os.tmpdir(), process.env.UPLOADS_DIR || "uploads")
    : path.resolve(process.cwd(), process.env.UPLOADS_DIR || "uploads"),
);

export function makeSafeFilename(originalname) {
  const ext =
    path
      .extname(originalname || "")
      .toLowerCase()
      .slice(0, 10) || ".jpg";
  return `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${ext}`;
}

export default { UPLOADS_DIR, makeSafeFilename };
