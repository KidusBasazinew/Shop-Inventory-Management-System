import api from "../lib/api";

export const suppliersService = {
  list: async (params) => {
    const { data } = await api.get("/suppliers", { params });
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/suppliers/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/suppliers", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.patch(`/suppliers/${id}`, payload);
    return data;
  },
};
