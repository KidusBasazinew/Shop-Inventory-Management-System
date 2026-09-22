import api from "../lib/api";

export const salesService = {
  list: async (params) => {
    const { data } = await api.get("/sales", { params });
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/sales/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/sales", payload);
    return data;
  },
};
