import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import ApiError from "../utils/apiError.js";
import { UPLOADS_DIR } from "../config/upload.js";
import { cloudinaryEnabled } from "../services/cloudinary.service.js";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — plenty for a phone screenshot

/**
 * Multer middleware for the subscription payment screenshot upload.
 *
 * Two storage modes, decided once at boot by cloudinaryEnabled:
 *  - Cloudinary configured -> MEMORY storage; the buffer is piped to
 *    Cloudinary in the controller and `screenshotUrl` becomes a CDN URL.
 *  - dev fallback          -> private local disk (random filenames), the
 *    same behavior as before; served via authenticated endpoints only.
 *
 * Images only, hard 8 MB cap, clear errors (not multer's HTML pages).
 */
const upload = multer({
  storage: cloudinaryEnabled
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination(req, file, cb) {
          cb(null, UPLOADS_DIR);
        },
        filename(req, file, cb) {
          const ext =
            path
              .extname(file.originalname || "")
              .toLowerCase()
              .slice(0, 10) || ".jpg";
          cb(null, `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${ext}`);
        },
      }),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(ApiError.badRequest("Only image files (JPG, PNG, WEBP) are allowed"));
      return;
    }
    cb(null, true);
  },
});

// Surface multer size/type errors as normal API errors.
function uploadScreenshot(req, res, next) {
  upload.single("screenshot")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Screenshot is too large (max 8 MB)"
          : `Upload failed: ${err.message}`;
      return next(ApiError.badRequest(message));
    }
    next(err);
  });
}

export default uploadScreenshot;
