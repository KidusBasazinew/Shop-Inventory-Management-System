import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

const SHOP_KEY = ["shop-me"];

export function useShop() {
  const { data, isLoading, isError } = useQuery({
    queryKey: SHOP_KEY,
    queryFn: async () => {
      const { data } = await api.get("/shop");
      return data; // shop record
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    shop: data ?? null,
    isLoading,
    isError,
  };
}

export function useUpdateShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.patch("/shop", payload);
      return data;
    },
    onSuccess: (shop) => {
      queryClient.setQueryData(SHOP_KEY, shop);
    },
  });
}
