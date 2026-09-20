import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export function useUser() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["pharmacy-me"],
    queryFn: async () => {
      const { data } = await api.get("/pharmacy/me");
      return data; // pharmacy record
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    pharmacy: data ?? null,
    isLoading,
    isError,
  };
}
