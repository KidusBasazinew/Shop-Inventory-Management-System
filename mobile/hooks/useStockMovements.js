import { useQuery } from "@tanstack/react-query";
import { stockMovementsService } from "../services/stockMovements.service";

export function useStockMovements(params) {
  return useQuery({
    queryKey: ["stock-movements", params],
    queryFn: () => stockMovementsService.list(params),
  });
}
