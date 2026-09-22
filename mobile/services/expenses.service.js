import api from "../lib/api";

export const expensesService = {
  list: async (params) => {
    const { data } = await api.get("/expenses", { params });
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/expenses/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/expenses", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.patch(`/expenses/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    await api.delete(`/expenses/${id}`);
  },
};
