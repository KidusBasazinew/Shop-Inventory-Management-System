import api from "../lib/api";

export const wasteService = {
  list: async (params) => {
    const { data } = await api.get("/waste", { params });
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/waste/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/waste", payload);
    return data;
  },
};
