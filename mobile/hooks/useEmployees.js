import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesService } from "../services/employees.service";

const EMPLOYEES_KEY = ["employees"];

export function useEmployees(params) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, params],
    queryFn: () => employeesService.list(params),
  });
}

export function useEmployee(id) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, id],
    queryFn: () => employeesService.get(id),
    enabled: !!id,
  });
}

export function usePayroll(employeeId, params) {
  return useQuery({
    queryKey: [...EMPLOYEES_KEY, employeeId, "payroll", params],
    queryFn: () => employeesService.listPayroll(employeeId, params),
    enabled: !!employeeId,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: employeesService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => employeesService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  });
}

export function useCreatePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, payload }) =>
      employeesService.createPayroll(employeeId, payload),
    onSuccess: (_, { employeeId }) =>
      queryClient.invalidateQueries({
        queryKey: [...EMPLOYEES_KEY, employeeId, "payroll"],
      }),
  });
}
