import api from "../lib/api";

export const employeesService = {
  list: async (params) => {
    const { data } = await api.get("/employees", { params });
    return data;
  },
  get: async (id) => {
    const { data } = await api.get(`/employees/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await api.post("/employees", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await api.patch(`/employees/${id}`, payload);
    return data;
  },
  listPayroll: async (id, params) => {
    const { data } = await api.get(`/employees/${id}/payroll`, { params });
    return data;
  },
  createPayroll: async (id, payload) => {
    const { data } = await api.post(`/employees/${id}/payroll`, payload);
    return data;
  },
};
