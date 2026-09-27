import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "../services/notifications.service";

const NOTIFICATIONS_KEY = ["notifications"];

export function useNotifications(limit = 50) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, limit],
    queryFn: () => notificationsService.list(limit),
    refetchInterval: 120_000, // gentle polling for renewal reminders
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "unread"],
    queryFn: () => notificationsService.unreadCount(),
    refetchInterval: 120_000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => notificationsService.markRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
}
