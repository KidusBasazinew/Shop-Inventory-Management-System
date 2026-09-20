import api from "../lib/api";

export const usersService = {
  list: async () => {
    const { data } = await api.get("/users");
    return data; // plain array of users
  },

  create: async (payload) => {
    const { data } = await api.post("/users", payload);
    return data;
  },

  update: async (id, payload) => {
    const { data } = await api.patch(`/users/${id}`, payload);
    return data;
  },

  deactivate: async (id) => {
    await api.delete(`/users/${id}`);
  },
};
