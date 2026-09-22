import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersService } from "../services/customers.service";

const CUSTOMERS_KEY = ["customers"];

export function useCustomers(params) {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, params],
    queryFn: () => customersService.list(params),
  });
}

export function useCustomer(id) {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, id],
    queryFn: () => customersService.get(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => customersService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  });
}
