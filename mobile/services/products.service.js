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
  /**
   * Upload/replace a product photo.
   * image: { uri, name?/fileName?, mimeType?/type? } from expo-image-picker.
   * The server resizes + compresses it before storing, so the client can
   * send a normal-quality camera photo without worrying about storage.
   */
  uploadPhoto: async (id, image) => {
    const formData = new FormData();
    formData.append("photo", {
      uri: image.uri,
      name: image.name ?? image.fileName ?? "product-photo.jpg",
      type: image.mimeType ?? image.type ?? "image/jpeg",
    });
    const { data } = await api.post(`/products/${id}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000, // uploads can be slow on mobile data
    });
    return data;
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
