import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export function useShop() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["shop-me"],
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
