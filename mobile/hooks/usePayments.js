import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsService } from "../services/payments.service";

const PAYMENTS_KEY = ["payments"];

export function usePayments(params) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, params],
    queryFn: () => paymentsService.list(params),
  });
}

export function usePayment(id) {
  return useQuery({
    queryKey: [...PAYMENTS_KEY, id],
    queryFn: () => paymentsService.get(id),
    enabled: !!id,
  });
}

function useInvalidatePayments() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: PAYMENTS_KEY });
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    queryClient.invalidateQueries({ queryKey: ["purchases"] });
    queryClient.invalidateQueries({ queryKey: ["customers"] });
    queryClient.invalidateQueries({ queryKey: ["suppliers"] });
  };
}

export function useCreateCustomerPayment() {
  const invalidate = useInvalidatePayments();
  return useMutation({
    mutationFn: paymentsService.createCustomerPayment,
    onSuccess: invalidate,
  });
}

export function useCreateSupplierPayment() {
  const invalidate = useInvalidatePayments();
  return useMutation({
    mutationFn: paymentsService.createSupplierPayment,
    onSuccess: invalidate,
  });
}
