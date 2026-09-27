import api from "../lib/api";

export const notificationsService = {
  async list(limit = 50) {
    const { data } = await api.get("/notifications", { params: { limit } });
    return data;
  },
  async unreadCount() {
    const { data } = await api.get("/notifications/unread-count");
    return data.count;
  },
  async markRead(ids) {
    const { data } = await api.post("/notifications/mark-read", { ids });
    return data;
  },
};

export default notificationsService;
