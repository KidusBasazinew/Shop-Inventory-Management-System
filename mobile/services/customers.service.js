import api from "../lib/api";

export const customersService = {
  list: async (params) => {
    const { data } = await api.get("/customers", { params });
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/customers/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/customers", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.patch(`/customers/${id}`, payload);
    return data;
  },
};
