import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsService } from "../services/products.service";

const PRODUCTS_KEY = ["products"];

export function useProducts(params) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, params],
    queryFn: () => productsService.list(params),
  });
}

// Convenience wrappers for the overview/alert screens.
export function useLowStockProducts() {
  return useProducts({ lowStock: true, limit: 100 });
}

export function useExpiringProducts(days = 30) {
  return useProducts({ expiringWithinDays: days, limit: 100 });
}

export function useProduct(id) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, id],
    queryFn: () => productsService.get(id),
    enabled: !!id,
  });
}

export function useStockHistory(id, params) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, id, "stock-history", params],
    queryFn: () => productsService.stockHistory(id, params),
    enabled: !!id,
  });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: productsService.create,
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, payload }) => productsService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeactivateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: productsService.deactivate,
    onSuccess: invalidate,
  });
}

export function useAddStock() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, payload }) => productsService.addStock(id, payload),
    onSuccess: invalidate,
  });
}

export function useRemoveStock() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, payload }) => productsService.removeStock(id, payload),
    onSuccess: invalidate,
  });
}

export function useAdjustStock() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, payload }) => productsService.adjustStock(id, payload),
    onSuccess: invalidate,
  });
}
