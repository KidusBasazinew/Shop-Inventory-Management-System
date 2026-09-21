import prisma from "../lib/prisma.js";
import ApiError from "../utils/apiError.js";

// Recomputes and persists a sale's cached status from its allocations.
// Called inside the same transaction as any write that touches its
// allocations, so the cached status never drifts from the ledger.
async function recomputeSaleStatus(tx, saleId) {
  const [sale, agg] = await Promise.all([
    tx.sale.findUnique({ where: { id: saleId } }),
    tx.paymentAllocation.aggregate({
      where: { saleId },
      _sum: { amount: true },
    }),
  ]);
  const paid = Number(agg._sum.amount ?? 0);
  const status =
    paid >= Number(sale.totalAmount) ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";
  await tx.sale.update({ where: { id: saleId }, data: { status } });
}

async function recomputePurchaseStatus(tx, purchaseId) {
  const [purchase, agg] = await Promise.all([
    tx.purchase.findUnique({ where: { id: purchaseId } }),
    tx.paymentAllocation.aggregate({
      where: { purchaseId },
      _sum: { amount: true },
    }),
  ]);
  const paid = Number(agg._sum.amount ?? 0);
  const status =
    paid >= Number(purchase.totalAmount)
      ? "PAID"
      : paid > 0
        ? "PARTIAL"
        : "UNPAID";
  await tx.purchase.update({ where: { id: purchaseId }, data: { status } });
}

// Shared core for both customer and supplier payments. `entityField` is
// "saleId" or "purchaseId"; `findOpen` returns that party's outstanding
// records (oldest first) when the caller didn't specify allocations.
async function recordPayment({
  shopId,
  type,
  partyField,
  partyId,
  amount,
  method,
  reference,
  note,
  date,
  allocations,
  entityField,
  findOpen,
  recomputeStatus,
}) {
  return prisma.$transaction(async (tx) => {
    let toAllocate = allocations;

    if (!toAllocate) {
      // Auto-allocate oldest-first up to `amount`; whatever's left over
      // stays unallocated (credit) rather than forcing an exact match.
      const open = await findOpen(tx, shopId, partyId);
      toAllocate = [];
      let remaining = amount;
      for (const record of open) {
        if (remaining <= 0) break;
        const balance = Number(record.totalAmount) - Number(record.amountPaid);
        if (balance <= 0) continue;
        const applied = Math.min(balance, remaining);
        toAllocate.push({ targetId: record.id, amount: applied });
        remaining -= applied;
      }
    } else {
      const sum = toAllocate.reduce((s, a) => s + a.amount, 0);
      if (sum > amount) {
        throw ApiError.badRequest(
          "Allocations cannot exceed the payment amount",
        );
      }
      // Validate every target belongs to this shop and this party before
      // touching anything.
      for (const a of toAllocate) {
        const record = await findOpen(tx, shopId, partyId, a.targetId);
        if (!record) {
          throw ApiError.badRequest(`Invalid allocation target: ${a.targetId}`);
        }
      }
    }

    const payment = await tx.payment.create({
      data: {
        shopId,
        type,
        [partyField]: partyId,
        amount,
        method,
        reference,
        note,
        date: date ?? new Date(),
      },
    });

    for (const a of toAllocate) {
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          [entityField]: a.targetId,
          amount: a.amount,
        },
      });
      await recomputeStatus(tx, a.targetId);
    }

    return { ...payment, allocations: toAllocate };
  });
}

async function findOpenSales(tx, shopId, customerId, onlyId) {
  const sales = await tx.sale.findMany({
    where: {
      shopId,
      customerId,
      status: { in: ["UNPAID", "PARTIAL"] },
      ...(onlyId ? { id: onlyId } : {}),
    },
    orderBy: { date: "asc" },
  });

  const withPaid = await Promise.all(
    sales.map(async (s) => {
      const agg = await tx.paymentAllocation.aggregate({
        where: { saleId: s.id },
        _sum: { amount: true },
      });
      return { ...s, amountPaid: Number(agg._sum.amount ?? 0) };
    }),
  );

  return onlyId ? (withPaid[0] ?? null) : withPaid;
}

async function findOpenPurchases(tx, shopId, supplierId, onlyId) {
  const purchases = await tx.purchase.findMany({
    where: {
      shopId,
      supplierId,
      status: { in: ["UNPAID", "PARTIAL"] },
      ...(onlyId ? { id: onlyId } : {}),
    },
    orderBy: { date: "asc" },
  });

  const withPaid = await Promise.all(
    purchases.map(async (p) => {
      const agg = await tx.paymentAllocation.aggregate({
        where: { purchaseId: p.id },
        _sum: { amount: true },
      });
      return { ...p, amountPaid: Number(agg._sum.amount ?? 0) };
    }),
  );

  return onlyId ? (withPaid[0] ?? null) : withPaid;
}

export async function recordCustomerPayment(shopId, data) {
  const customer = await prisma.customer.findUnique({
    where: { id: data.customerId },
  });
  if (!customer || customer.shopId !== shopId)
    throw ApiError.notFound("Customer not found");

  return recordPayment({
    shopId,
    type: "CUSTOMER_PAYMENT",
    partyField: "customerId",
    partyId: data.customerId,
    amount: data.amount,
    method: data.method,
    reference: data.reference,
    note: data.note,
    date: data.date,
    allocations: data.allocations,
    entityField: "saleId",
    findOpen: findOpenSales,
    recomputeStatus: recomputeSaleStatus,
  });
}

export async function recordSupplierPayment(shopId, data) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: data.supplierId },
  });
  if (!supplier || supplier.shopId !== shopId)
    throw ApiError.notFound("Supplier not found");

  return recordPayment({
    shopId,
    type: "SUPPLIER_PAYMENT",
    partyField: "supplierId",
    partyId: data.supplierId,
    amount: data.amount,
    method: data.method,
    reference: data.reference,
    note: data.note,
    date: data.date,
    allocations: data.allocations,
    entityField: "purchaseId",
    findOpen: findOpenPurchases,
    recomputeStatus: recomputePurchaseStatus,
  });
}

export async function listPayments(
  shopId,
  { type, customerId, supplierId, from, to, page, limit },
) {
  const where = {
    shopId,
    ...(type ? { type } : {}),
    ...(customerId ? { customerId } : {}),
    ...(supplierId ? { supplierId } : {}),
    ...(from || to
      ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { allocations: true, customer: true, supplier: true },
    }),
    prisma.payment.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getPayment(shopId, paymentId) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      allocations: { include: { sale: true, purchase: true } },
      customer: true,
      supplier: true,
    },
  });
  if (!payment || payment.shopId !== shopId)
    throw ApiError.notFound("Payment not found");
  return payment;
}

export default {
  recordCustomerPayment,
  recordSupplierPayment,
  listPayments,
  getPayment,
};
