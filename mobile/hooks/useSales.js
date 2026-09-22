import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salesService } from "../services/sales.service";

const SALES_KEY = ["sales"];

export function useSales(params) {
  return useQuery({
    queryKey: [...SALES_KEY, params],
    queryFn: () => salesService.list(params),
  });
}

export function useSale(id) {
  return useQuery({
    queryKey: [...SALES_KEY, id],
    queryFn: () => salesService.get(id),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesService.create,
    onSuccess: () => {
      // A sale moves stock and can create a payment/customer balance.
      queryClient.invalidateQueries({ queryKey: SALES_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
