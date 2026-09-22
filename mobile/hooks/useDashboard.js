import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/reports/dashboard");
      return data;
    },
    staleTime: 60 * 1000,
  });
}
