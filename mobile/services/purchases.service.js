import api from "../lib/api";

export const purchasesService = {
  list: async (params) => {
    const { data } = await api.get("/purchases", { params });
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/purchases/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/purchases", payload);
    return data;
  },
};
