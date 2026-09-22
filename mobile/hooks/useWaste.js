import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wasteService } from "../services/waste.service";

const WASTE_KEY = ["waste"];

export function useWaste(params) {
  return useQuery({
    queryKey: [...WASTE_KEY, params],
    queryFn: () => wasteService.list(params),
  });
}

export function useCreateWaste() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: wasteService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WASTE_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
