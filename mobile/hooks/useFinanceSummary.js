import { useMemo } from "react";
import { useSales } from "./useSales";
import { useExpenses } from "./useExpenses";
import { useWaste } from "./useWaste";
import { useTaxPayments } from "./useTax";
import { useAuth } from "../context/AuthContext";

// Shared revenue/COGS/profit math for the Finance Overview and Profit
// screens. COGS is an estimate: each sale item's cost is taken from the
// product's *current* buyingPrice, not a historical snapshot — accurate
// enough for a running P&L glance, not for strict historical accounting.
export function useFinanceSummary({ limit = 100 } = {}) {
  const { user } = useAuth();
  const canSeeTax = user?.role === "OWNER" || user?.role === "MANAGER";

  const {
    data: salesData,
    isLoading: isLoadingSales,
    isError: isErrorSales,
  } = useSales({ limit });

  const {
    data: expensesData,
    isLoading: isLoadingExpenses,
    isError: isErrorExpenses,
  } = useExpenses({ limit: 100 });

  const {
    data: wasteData,
    isLoading: isLoadingWaste,
    isError: isErrorWaste,
  } = useWaste({ limit: 100 });

  // Tax payments are OWNER/MANAGER-only on the backend — don't even fire
  // this query for a CASHIER, that would just be a guaranteed 403.
  const {
    data: taxData,
    isLoading: isLoadingTax,
    isError: isErrorTax,
  } = useTaxPayments({ limit: 100 }, { enabled: canSeeTax });

  const sales = salesData?.items ?? [];
  const operationalExpenses = Number(expensesData?.totalAmount ?? 0);
  const wasteValue = Number(wasteData?.totalValue ?? 0);
  const taxPaid = canSeeTax
    ? (taxData?.items ?? []).reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
    : 0;

  return useMemo(() => {
    const revenue = sales.reduce(
      (sum, s) => sum + Number(s.totalAmount ?? 0),
      0,
    );

    const cogs = sales.reduce((sum, sale) => {
      const itemsCost = (sale.items ?? []).reduce((itemSum, item) => {
        const cost = Number(item.product?.buyingPrice ?? 0);
        return itemSum + cost * Number(item.quantity ?? 0);
      }, 0);
      return sum + itemsCost;
    }, 0);

    const totalExpenses = operationalExpenses + cogs + wasteValue + taxPaid;
    const grossProfit = revenue - cogs;
    const netProfit = revenue - totalExpenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const chartData = sales
      .slice(0, 7)
      .map((s) => ({
        value: Number(s.totalAmount ?? 0),
        label: `#${s.id.slice(-4)}`,
        frontColor: "#004ac6",
        gradientColor: "#3b82f6",
      }))
      .reverse();

    return {
      sales,
      totalRevenue: revenue,
      cogsAmount: cogs,
      operationalExpenses,
      wasteValue,
      taxPaid,
      totalExpenses,
      grossProfit,
      netProfit,
      profitMargin: profitMargin.toFixed(1),
      chartData:
        chartData.length > 0 ? chartData : [{ value: 0, label: "N/A" }],
      isLoading:
        isLoadingSales ||
        isLoadingExpenses ||
        isLoadingWaste ||
        (canSeeTax && isLoadingTax),
      isError:
        isErrorSales ||
        isErrorExpenses ||
        isErrorWaste ||
        (canSeeTax && isErrorTax),
    };
  }, [
    sales,
    operationalExpenses,
    wasteValue,
    taxPaid,
    isLoadingSales,
    isLoadingExpenses,
    isLoadingWaste,
    isLoadingTax,
    isErrorSales,
    isErrorExpenses,
    isErrorWaste,
    isErrorTax,
    canSeeTax,
  ]);
}
