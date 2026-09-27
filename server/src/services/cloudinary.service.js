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
  destroyScreenshot,
  screenshotViewUrl,
};
