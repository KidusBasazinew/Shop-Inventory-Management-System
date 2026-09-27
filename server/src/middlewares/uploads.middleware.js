import multer from "multer";
import ApiError from "../utils/apiError.js";
import { UPLOADS_DIR, makeSafeFilename } from "../config/upload.js";

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
 * - disk storage into the private uploads dir with a random filename
 * - images only, hard 8 MB cap, clear errors (not multer's HTML pages)
 */
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, UPLOADS_DIR);
    },
    filename(req, file, cb) {
      cb(null, makeSafeFilename(file.originalname));
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
