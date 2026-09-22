import api from "../lib/api";

export const paymentsService = {
  list: async (params) => {
    const { data } = await api.get("/payments", { params });
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/payments/${id}`);
    return data;
  },
  createCustomerPayment: async (payload) => {
    const { data } = await api.post("/payments/customer", payload);
    return data;
  },
  createSupplierPayment: async (payload) => {
    const { data } = await api.post("/payments/supplier", payload);
    return data;
  },
};
