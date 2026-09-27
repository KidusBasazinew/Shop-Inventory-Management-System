import prisma from "../lib/prisma.js";

/**
 * In-app notifications for shop owners: renewal reminders (3/2/1 days
 * out), payment verified / rejected, trial ending, expiry. The mobile
 * app polls GET /notifications and shows unread ones.
 */
export async function createNotification({
  shopId,
  type,
  title,
  body,
  severity = "info",
  payload,
}) {
  try {
    return await prisma.notification.create({
      data: { shopId, type, title, body, severity, payload: payload ?? undefined },
    });
  } catch (err) {
    // Notifications must never break the main flow.
    console.error("[notification] create failed:", err?.message);
    return null;
  }
}

export async function listNotifications(shopId, { limit = 50 } = {}) {
  return prisma.notification.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 100),
  });
}

export async function unreadCount(shopId) {
  return prisma.notification.count({ where: { shopId, isRead: false } });
}

export async function markNotificationsRead(shopId, ids) {
  const result = await prisma.notification.updateMany({
    where: { shopId, id: { in: ids } },
    data: { isRead: true },
  });
  return { updated: result.count };
}

export default { createNotification, listNotifications, unreadCount };
