import api from "../lib/api";

export const taxService = {
  listPayments: async (params) => {
    const { data } = await api.get("/tax/payments", { params });
    return data;
  },
  createPayment: async (payload) => {
    const { data } = await api.post("/tax/payments", payload);
    return data;
  },
  vatReport: async (params) => {
    const { data } = await api.get("/tax/vat-report", { params });
    return data;
  },
};
