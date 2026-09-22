import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchasesService } from "../services/purchases.service";

const PURCHASES_KEY = ["purchases"];

export function usePurchases(params) {
  return useQuery({
    queryKey: [...PURCHASES_KEY, params],
    queryFn: () => purchasesService.list(params),
  });
}

export function usePurchase(id) {
  return useQuery({
    queryKey: [...PURCHASES_KEY, id],
    queryFn: () => purchasesService.get(id),
    enabled: !!id,
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: purchasesService.create,
    onSuccess: () => {
      // A purchase moves stock, so products need refreshing too.
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}
