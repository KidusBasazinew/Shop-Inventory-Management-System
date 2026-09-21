import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";

export async function listSales(
  shopId,
  { customerId, status, from, to, page, limit },
) {
  const where = {
    shopId,
    ...(customerId ? { customerId } : {}),
    ...(status ? { status } : {}),
    ...(from || to
      ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: { select: { id: true, name: true } },
        items: true,
      },
    }),
    prisma.sale.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getSale(shopId, saleId) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      customer: true,
      items: { include: { product: { select: { id: true, name: true } } } },
      allocations: { include: { payment: true } },
    },
  });
  if (!sale || sale.shopId !== shopId)
    throw ApiError.notFound("Sale not found");

  const paid = sale.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
  return {
    ...sale,
    amountPaid: paid,
    balance: Number(sale.totalAmount) - paid,
  };
}

export async function createSale(
  shopId,
  { customerId, date, items, amountPaid, paymentMethod },
  userId,
) {
  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer || customer.shopId !== shopId)
      throw ApiError.notFound("Customer not found");
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, shopId },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));
  if (productMap.size !== new Set(productIds).size) {
    throw ApiError.badRequest(
      "One or more products were not found in this shop",
    );
  }

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (Number(product.quantity) < Number(item.quantity)) {
      throw ApiError.badRequest(
        `Not enough stock for "${product.name}" — only ${product.quantity} available`,
      );
    }
  }

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });

  const itemsWithSubtotal = items.map((i) => {
    const product = productMap.get(i.productId);
    const unitPrice = i.unitPrice ?? Number(product.sellingPrice);
    return { ...i, unitPrice, subtotal: unitPrice * i.quantity };
  });

  const subtotal = itemsWithSubtotal.reduce((sum, i) => sum + i.subtotal, 0);
  const taxAmount = subtotal * (Number(shop.taxRatePercent) / 100);
  const totalAmount = subtotal + taxAmount;

  const paid = amountPaid ?? totalAmount; // default: fully paid

  if (!customerId && paid < totalAmount) {
    throw ApiError.badRequest(
      "A customer is required to record a partial or credit sale",
    );
  }
  if (paid > totalAmount) {
    throw ApiError.badRequest("Amount paid cannot exceed the sale total");
  }

  const status = paid >= totalAmount ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        shopId,
        customerId,
        soldById: userId,
        date: date ?? new Date(),
        subtotal,
        taxAmount,
        totalAmount,
        status,
        items: {
          create: itemsWithSubtotal.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal: i.subtotal,
          })),
        },
      },
      include: { items: true },
    });

    for (const item of itemsWithSubtotal) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          shopId,
          productId: item.productId,
          type: "SALE",
          quantity: -item.quantity,
          saleId: sale.id,
          createdById: userId,
        },
      });
    }

    if (paid > 0) {
      const payment = await tx.payment.create({
        data: {
          shopId,
          type: "CUSTOMER_PAYMENT",
          customerId,
          amount: paid,
          method: paymentMethod,
          note: "Recorded at time of sale",
        },
      });
      await tx.paymentAllocation.create({
        data: { paymentId: payment.id, saleId: sale.id, amount: paid },
      });
    }

    return sale;
  });
}

export default { listSales, getSale, createSale };
