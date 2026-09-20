import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";
import { getOwnedProduct } from "./product.service.js";

export async function addStock(shopId, productId, { quantity, note }, userId) {
  await getOwnedProduct(shopId, productId);

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id: productId },
      data: { quantity: { increment: quantity } },
    });

    await tx.stockMovement.create({
      data: {
        shopId,
        productId,
        type: "ADJUSTMENT",
        quantity,
        note: note ?? "Manual stock addition",
        createdById: userId,
      },
    });

    return product;
  });
}

export async function removeStock(
  shopId,
  productId,
  { quantity, note },
  userId,
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product || product.shopId !== shopId)
      throw ApiError.notFound("Product not found");

    if (Number(product.quantity) < Number(quantity)) {
      throw ApiError.badRequest(
        `Cannot remove ${quantity} — only ${product.quantity} in stock`,
      );
    }

    const updated = await tx.product.update({
      where: { id: productId },
      data: { quantity: { decrement: quantity } },
    });

    await tx.stockMovement.create({
      data: {
        shopId,
        productId,
        type: "ADJUSTMENT",
        quantity: -quantity,
        note: note ?? "Manual stock removal",
        createdById: userId,
      },
    });

    return updated;
  });
}

export async function adjustStock(
  shopId,
  productId,
  { newQuantity, note },
  userId,
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product || product.shopId !== shopId)
      throw ApiError.notFound("Product not found");

    const delta = Number(newQuantity) - Number(product.quantity);

    const updated = await tx.product.update({
      where: { id: productId },
      data: { quantity: newQuantity },
    });

    if (delta !== 0) {
      await tx.stockMovement.create({
        data: {
          shopId,
          productId,
          type: "ADJUSTMENT",
          quantity: delta,
          note: note ?? `Physical count adjustment (was ${product.quantity})`,
          createdById: userId,
        },
      });
    }

    return updated;
  });
}

export async function getStockHistory(shopId, productId, { page, limit }) {
  await getOwnedProduct(shopId, productId);

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where: { shopId, productId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { createdBy: { select: { id: true, name: true } } },
    }),
    prisma.stockMovement.count({ where: { shopId, productId } }),
  ]);

  return { items, total, page, limit };
}

export default { addStock, removeStock, adjustStock, getStockHistory };
