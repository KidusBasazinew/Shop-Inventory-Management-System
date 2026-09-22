import api from "../lib/api";

export const stockMovementsService = {
  list: async (params) => {
    const { data } = await api.get("/stock-movements", { params });
    return data;
  },
};
