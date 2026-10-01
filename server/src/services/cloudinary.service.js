/**
 * Cloudinary storage for subscription payment screenshots.
 *
 * Why Cloudinary: it is an image CDN with a generous free tier — uploads
 * return a durable https URL we can store in `screenshotUrl` and render
 * straight from the dashboard. (Neon is a Postgres database; keeping
 * image blobs in Postgres bloats the DB and slows every query, so it is
 * the wrong tool for this job.)
 *
 * Storage mode:
 *  - CLOUDINARY_* env vars set  -> screenshots go to Cloudinary
 *    (folder: cloudName/payment-screenshots) and `screenshotUrl` holds
 *    the https URL.
 *  - not configured             -> dev fallback: private local disk under
 *    UPLOADS_DIR (served through authenticated endpoints only), and
 *    `screenshotUrl` holds the bare filename, exactly like before.
 *
 * The rest of the app only ever sees `screenshotUrl`, so switching
 * providers later needs no model changes.
 */
import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const cloudinaryEnabled = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

const FOLDER = process.env.CLOUDINARY_FOLDER || "payment-screenshots";
const PRODUCT_FOLDER =
  process.env.CLOUDINARY_PRODUCT_FOLDER || "product-photos";

// Product photos are display thumbnails, not assets — cap the stored
// dimensions so a 12 MP phone camera photo costs ~100 KB, not several MB.
const PHOTO_MAX_DIMENSION = 1000;

/**
 * Upload a buffer to Cloudinary.
 * Returns { url, publicId } — url goes into SubscriptionPayment.screenshotUrl.
 */
export async function uploadScreenshotBuffer(buffer, { shopId } = {}) {
  if (!cloudinaryEnabled) {
    throw new Error(
      "Cloudinary is not configured (set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)",
    );
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: shopId ? `${FOLDER}/${shopId}` : FOLDER,
        resource_type: "image",
        // Screenshots of receipts — keep the original untouched; the
        // dashboard renders a resized variant via the delivery URL.
        overwrite: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

/**
 * Upload a product photo buffer.
 *
 * The `transformation` passed here is an *incoming* transformation:
 * Cloudinary applies it before storing the asset, so the resized +
 * compressed version IS the stored original. Combined with the client
 * sending `quality: 0.6` from expo-image-picker, a high-resolution camera
 * photo lands in storage at roughly 100-200 KB instead of many MB.
 */
export async function uploadProductPhotoBuffer(buffer, { shopId } = {}) {
  if (!cloudinaryEnabled) {
    throw new Error(
      "Cloudinary is not configured (set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)",
    );
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: shopId ? `${PRODUCT_FOLDER}/${shopId}` : PRODUCT_FOLDER,
        resource_type: "image",
        transformation: [
          { width: PHOTO_MAX_DIMENSION, height: PHOTO_MAX_DIMENSION, crop: "limit" },
          { quality: "auto:eco" },
        ],
        overwrite: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

/**
 * Delete a screenshot (used if a submission is withdrawn/invalid).
 * Never throws — cleanup is best-effort.
 */
export async function destroyScreenshot(publicId) {
  if (!cloudinaryEnabled || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("[cloudinary] destroy failed:", err?.message);
  }
}

/**
 * Generic best-effort asset delete (used when a product photo is
 * replaced or removed). Never throws.
 */
export async function destroyImage(publicId) {
  if (!cloudinaryEnabled || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("[cloudinary] destroy image failed:", err?.message);
  }
}

/**
 * Derive a Cloudinary public_id from a stored secure_url, so we can
 * delete a replaced/removed product photo without a `photoPublicId`
 * column. Returns null for non-Cloudinary (local) URLs.
 */
export function publicIdFromUrl(url) {
  if (!url || !/^https?:\/\//.test(url)) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  return match ? match[1] : null;
}

/**
 * Delivery URL helpers. Cloudinary URLs can carry on-the-fly transforms;
 * local files have none, so the dashboard fetches those through the API.
 */
export function screenshotViewUrl(screenshotUrl, { width = 900 } = {}) {
  if (!screenshotUrl) return null;
  if (/^https?:\/\//.test(screenshotUrl)) {
    // .../upload/v123/.../img.jpg -> .../upload/w_900,q_auto/f_auto/v123/.../img.jpg
    return screenshotUrl.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
  }
  return null; // local file — stream through the authenticated endpoint
}

export default {
  cloudinaryEnabled,
  uploadScreenshotBuffer,
  uploadProductPhotoBuffer,
  destroyScreenshot,
  destroyImage,
  screenshotViewUrl,
  publicIdFromUrl,
};
