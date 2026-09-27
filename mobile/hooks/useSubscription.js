import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "../services/subscription.service";

const STATUS_KEY = ["subscription-status"];
const MY_PAYMENTS_KEY = ["subscription-payments"];

export function useSubscription() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => subscriptionService.getStatus(),
    staleTime: 60_000,
  });
}

export function useMySubscriptionPayments() {
  return useQuery({
    queryKey: MY_PAYMENTS_KEY,
    queryFn: () => subscriptionService.listMyPayments(),
  });
}

export function useSubmitPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, image }) =>
      subscriptionService.submitPayment(payload, image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: MY_PAYMENTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["shop-me"] });
    },
  });
}

export function useSubscriptionPayments() {
  return useMySubscriptionPayments;
}

export default { useSubscription, useMySubscriptionPayments, useSubmitPayment };
