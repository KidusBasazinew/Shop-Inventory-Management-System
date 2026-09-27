import api from "../lib/api";

/**
 * Subscription / renewal APIs for the shop owner app.
 * Renewal works by uploading a screenshot of the manual transfer
 * (bank / telebirr / CBE); the platform owner verifies it and the
 * subscription is extended 30 days per plan month.
 */
export const subscriptionService = {
  async getStatus() {
    const { data } = await api.get("/subscription/status");
    return data;
  },

  /**
   * payload: { planMonths, payerName?, payerPhone?, bankReference? }
   * image: { uri, name?, mimeType? } from expo-image-picker
   */
  async submitPayment(payload, image) {
    const formData = new FormData();
    formData.append("planMonths", String(payload.planMonths));
    if (payload.payerName) formData.append("payerName", payload.payerName);
    if (payload.payerPhone) formData.append("payerPhone", payload.payerPhone);
    if (payload.bankReference) formData.append("bankReference", payload.bankReference);
    formData.append("screenshot", {
      uri: image.uri,
      name: image.name ?? image.fileName ?? "payment-screenshot.jpg",
      type: image.mimeType ?? image.type ?? "image/jpeg",
    });
    const { data } = await api.post("/subscription/payments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000, // uploads can be slow on mobile data
    });
    return data;
  },

  async listMyPayments() {
    const { data } = await api.get("/subscription/payments");
    return data;
  },

  screenshotUri(paymentId) {
    return `${api.defaults.baseURL}/subscription/payments/${paymentId}/screenshot`;
  },
};

export default subscriptionService;
