import api from "../lib/api";

export async function getShop() {
  const { data } = await api.get("/shop");
  return data;
}

/**
 * Subscription status for the renewal flow: status, days remaining,
 * price and any payment currently under review.
 */
export async function getSubscriptionStatus() {
  const { data } = await api.get("/subscription/status");
  return data;
}
