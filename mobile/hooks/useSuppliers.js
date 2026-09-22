import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { suppliersService } from "../services/suppliers.service";

const SUPPLIERS_KEY = ["suppliers"];

export function useSuppliers(params) {
  return useQuery({
    queryKey: [...SUPPLIERS_KEY, params],
    queryFn: () => suppliersService.list(params),
  });
}

export function useSupplier(id) {
  return useQuery({
    queryKey: [...SUPPLIERS_KEY, id],
    queryFn: () => suppliersService.get(id),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: suppliersService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY }),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => suppliersService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SUPPLIERS_KEY }),
  });
}
