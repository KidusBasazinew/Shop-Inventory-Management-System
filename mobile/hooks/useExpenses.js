import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesService } from "../services/expenses.service";

const EXPENSES_KEY = ["expenses"];

export function useExpenses(params) {
  return useQuery({
    queryKey: [...EXPENSES_KEY, params],
    queryFn: () => expensesService.list(params),
  });
}

function useInvalidateExpenses() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
}

export function useCreateExpense() {
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: expensesService.create,
    onSuccess: invalidate,
  });
}

export function useUpdateExpense() {
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: ({ id, payload }) => expensesService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteExpense() {
  const invalidate = useInvalidateExpenses();
  return useMutation({
    mutationFn: expensesService.remove,
    onSuccess: invalidate,
  });
}
