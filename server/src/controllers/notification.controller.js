import catchAsync from "../utils/catchAsync.js";
import * as notificationService from "../services/notification.service.js";

export const list = catchAsync(async (req, res) => {
  const notifications = await notificationService.listNotifications(req.shopId, {
    limit: req.query.limit,
  });
  res.status(200).json(notifications);
});

export const unread = catchAsync(async (req, res) => {
  const count = await notificationService.unreadCount(req.shopId);
  res.status(200).json({ count });
});

export const markRead = catchAsync(async (req, res) => {
  const result = await notificationService.markNotificationsRead(
    req.shopId,
    req.body.ids,
  );
  res.status(200).json(result);
});

export default { list, unread, markRead };
