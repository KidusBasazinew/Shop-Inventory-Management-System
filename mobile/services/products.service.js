import api from "../lib/api";

export const productsService = {
  list: async (params) => {
    const { data } = await api.get("/products", { params });
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/products", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.patch(`/products/${id}`, payload);
    return data;
  },
  deactivate: async (id) => {
    await api.delete(`/products/${id}`);
  },
  addStock: async (id, payload) => {
    const { data } = await api.post(`/products/${id}/stock/add`, payload);
    return data;
  },
  removeStock: async (id, payload) => {
    const { data } = await api.post(`/products/${id}/stock/remove`, payload);
    return data;
  },
  adjustStock: async (id, payload) => {
    const { data } = await api.post(`/products/${id}/stock/adjust`, payload);
    return data;
  },
  stockHistory: async (id, params) => {
    const { data } = await api.get(`/products/${id}/stock/history`, { params });
    return data;
  },
};
