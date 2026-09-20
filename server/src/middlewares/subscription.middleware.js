import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";

export default async function subscriptionGuard(req, res, next) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: req.shopId },
      select: {
        id: true,
        subscriptionStatus: true,
        trialEnd: true,
        subscriptionEnd: true,
      },
    });

    if (!shop) return next(ApiError.notFound("Shop not found"));

    if (
      shop.subscriptionStatus === "TRIAL" &&
      shop.trialEnd &&
      shop.trialEnd < new Date()
    ) {
      await prisma.shop.update({
        where: { id: shop.id },
        data: { subscriptionStatus: "EXPIRED" },
      });
      return next(
        ApiError.paymentRequired(
          "Trial expired. Please subscribe to continue.",
        ),
      );
    }

    if (
      shop.subscriptionStatus === "ACTIVE" &&
      shop.subscriptionEnd &&
      shop.subscriptionEnd < new Date()
    ) {
      await prisma.shop.update({
        where: { id: shop.id },
        data: { subscriptionStatus: "EXPIRED" },
      });
      return next(
        ApiError.paymentRequired(
          "Subscription expired. Please renew to continue.",
        ),
      );
    }

    if (
      shop.subscriptionStatus === "EXPIRED" ||
      shop.subscriptionStatus === "CANCELED"
    ) {
      return next(ApiError.paymentRequired("Subscription is not active."));
    }
    next();
  } catch (err) {
    next(err);
  }
}
