import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taxService } from "../services/tax.service";

const TAX_KEY = ["tax-payments"];

export function useTaxPayments(params, options = {}) {
  return useQuery({
    queryKey: [...TAX_KEY, params],
    queryFn: () => taxService.listPayments(params),
    enabled: options.enabled ?? true,
  });
}

export function useVatReport(params) {
  return useQuery({
    queryKey: ["vat-report", params],
    queryFn: () => taxService.vatReport(params),
    enabled: !!(params?.from && params?.to),
  });
}

export function useCreateTaxPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: taxService.createPayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TAX_KEY }),
  });
}
