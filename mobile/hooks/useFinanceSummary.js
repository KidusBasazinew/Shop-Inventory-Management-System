import { useMemo } from "react";
import { useSales } from "./useSales";
import { useExpenses } from "./useExpenses";

// Shared revenue/COGS/profit math for the Finance Overview and Profit
// screens. COGS is an estimate: each sale item's cost is taken from the
// product's *current* buyingPrice, not a historical snapshot — accurate
// enough for a running P&L glance, not for strict historical accounting.
export function useFinanceSummary({ limit = 100 } = {}) {
  const { data: salesData, isLoading: isLoadingSales } = useSales({ limit });
  const { data: expensesData, isLoading: isLoadingExpenses } = useExpenses({
    limit: 200,
  });

  const sales = salesData?.items ?? [];
  const operationalExpenses = Number(expensesData?.totalAmount ?? 0);

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

    const totalExpenses = operationalExpenses + cogs;
    const grossProfit = revenue - cogs;
    const netProfit = revenue - totalExpenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const chartData = sales
      .slice(0, 7)
      .map((s, idx) => ({
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
      totalExpenses,
      grossProfit,
      netProfit,
      profitMargin: profitMargin.toFixed(1),
      chartData:
        chartData.length > 0 ? chartData : [{ value: 0, label: "N/A" }],
      isLoading: isLoadingSales || isLoadingExpenses,
    };
  }, [sales, operationalExpenses, isLoadingSales, isLoadingExpenses]);
}
