import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";

export async function listWaste(
  shopId,
  { productId, reason, from, to, page, limit },
) {
  const where = {
    shopId,
    ...(productId ? { productId } : {}),
    ...(reason ? { reason } : {}),
    ...(from || to
      ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
  };

  const [items, total, valueAgg] = await Promise.all([
    prisma.wasteRecord.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: { select: { id: true, name: true, buyingPrice: true } },
      },
    }),
    prisma.wasteRecord.count({ where }),
    // Waste value = quantity * buying price, computed per-record since the
    // schema doesn't store a snapshot price on WasteRecord itself.
    prisma.wasteRecord.findMany({
      where,
      select: { quantity: true, product: { select: { buyingPrice: true } } },
    }),
  ]);

  const totalValue = valueAgg.reduce(
    (sum, w) => sum + Number(w.quantity) * Number(w.product.buyingPrice),
    0,
  );

  return { items, total, page, limit, totalValue };
}

export async function getWasteRecord(shopId, wasteId) {
  const record = await prisma.wasteRecord.findUnique({
    where: { id: wasteId },
    include: { product: true, createdBy: { select: { id: true, name: true } } },
  });
  if (!record || record.shopId !== shopId)
    throw ApiError.notFound("Waste record not found");
  return record;
}

export async function createWasteRecord(
  shopId,
  { productId, quantity, reason, photoUrl, date },
  userId,
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product || product.shopId !== shopId)
      throw ApiError.notFound("Product not found");

    if (Number(product.quantity) < Number(quantity)) {
      throw ApiError.badRequest(
        `Cannot record ${quantity} as waste — only ${product.quantity} in stock`,
      );
    }

    const waste = await tx.wasteRecord.create({
      data: {
        shopId,
        productId,
        quantity,
        reason,
        photoUrl,
        date: date ?? new Date(),
        createdById: userId,
      },
    });

    await tx.product.update({
      where: { id: productId },
      data: { quantity: { decrement: quantity } },
    });

    await tx.stockMovement.create({
      data: {
        shopId,
        productId,
        type: "WASTE",
        quantity: -quantity,
        wasteId: waste.id,
        note: `Waste: ${reason}`,
        createdById: userId,
      },
    });

    return waste;
  });
}

export default { listWaste, getWasteRecord, createWasteRecord };
