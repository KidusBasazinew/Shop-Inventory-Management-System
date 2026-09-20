import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";

export async function getShop(shopId) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw ApiError.notFound("Shop not found");
  return shop;
}

export async function updateShop(shopId, data) {
  // subscriptionStatus/trialEnd/subscriptionEnd are deliberately not
  // accepted here — those are only ever changed by the subscription
  // middleware or the future payment webhook, never by a direct PATCH.
  const shop = await prisma.shop.update({ where: { id: shopId }, data });
  return shop;
}

export default { getShop, updateShop };
