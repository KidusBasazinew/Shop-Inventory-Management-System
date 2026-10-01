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

const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024; // 8 MB — plenty for a phone screenshot
const MAX_PRODUCT_PHOTO_BYTES = 15 * 1024 * 1024; // camera originals can be large

function imageFileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    cb(ApiError.badRequest("Only image files (JPG, PNG, WEBP) are allowed"));
    return;
  }
  cb(null, true);
}

function diskStorage() {
  return multer.diskStorage({
    destination(req, file, cb) {
      cb(null, UPLOADS_DIR);
    },
    filename(req, file, cb) {
      const ext =
        path.extname(file.originalname || "").toLowerCase().slice(0, 10) ||
        ".jpg";
      cb(
        null,
        `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${ext}`,
      );
    },
  });
}

/** Wrap a multer single-file upload, surfacing its errors as API errors. */
function asMiddleware(upload, field, tooLargeMessage) {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        const message =
          err.code === "LIMIT_FILE_SIZE"
            ? tooLargeMessage
            : `Upload failed: ${err.message}`;
        return next(ApiError.badRequest(message));
      }
      next(err);
    });
  };
}

/**
 * Subscription payment screenshot upload.
 *
 * Two storage modes, decided once at boot by cloudinaryEnabled:
 *  - Cloudinary configured -> MEMORY storage; the buffer is piped to
 *    Cloudinary in the controller and `screenshotUrl` becomes a CDN URL.
 *  - dev fallback          -> private local disk (random filenames), the
 *    same behavior as before; served via authenticated endpoints only.
 *
 * Images only, hard 8 MB cap, clear errors (not multer's HTML pages).
 */
const screenshotUpload = multer({
  storage: cloudinaryEnabled ? multer.memoryStorage() : diskStorage(),
  limits: { fileSize: MAX_SCREENSHOT_BYTES, files: 1 },
  fileFilter: imageFileFilter,
});

const uploadScreenshot = asMiddleware(
  screenshotUpload,
  "screenshot",
  "Screenshot is too large (max 8 MB)",
);

/**
 * Product photo upload. Always MEMORY storage: the buffer is resized and
 * compressed by Cloudinary (see uploadProductPhotoBuffer) so the stored
 * asset stays small regardless of the camera that produced it.
 */
const productPhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PRODUCT_PHOTO_BYTES, files: 1 },
  fileFilter: imageFileFilter,
});

export const uploadProductPhoto = asMiddleware(
  productPhotoUpload,
  "photo",
  "Photo is too large (max 15 MB)",
);

export default uploadScreenshot;
