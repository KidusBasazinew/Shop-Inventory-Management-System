import React, { useMemo } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import {
  TrendingUp,
  ShieldCheck,
  Percent,
  ArrowUpRight,
  Receipt,
  Wallet,
} from "lucide-react-native";
import { useSales } from "../../../hooks/useSales";
import { useExpenseSummary } from "../../../hooks/useExpenses";

export default function FinanceProfit() {
  // 1. Fetch real sales and real expense data
  const { data: salesData, isLoading: isLoadingSales } = useSales({
    limit: 100,
  });
  const { data: expenseSummary, isLoading: isLoadingExpenses } =
    useExpenseSummary();

  // Extract raw collections with safe fallbacks
  const sales = useMemo(() => {
    if (Array.isArray(salesData)) return salesData;
    return salesData?.sales ?? salesData?.data ?? [];
  }, [salesData]);

  const operationalExpenses = useMemo(() => {
    if (typeof expenseSummary === "number") return expenseSummary;
    return Number(
      expenseSummary?.totalExpenses ??
        expenseSummary?.total ??
        expenseSummary?.data?.total ??
        0,
    );
  }, [expenseSummary]);

  // 2. Compute Real Financial & Profit Metrics
  const {
    grossSales,
    cogsAmount,
    totalExpenses,
    grossProfit,
    netProfit,
    profitMargin,
    healthStatus,
    healthBadgeStyle,
  } = useMemo(() => {
    // A. Gross Sales Revenue
    const revenue = sales.reduce((acc, s) => {
      const rawVal =
        s.totalAmount ??
        s.total_amount ??
        s.total ??
        s.grandTotal ??
        s.grand_total;

      let saleVal = Number(rawVal);

      // Line item fallback
      if (isNaN(saleVal) || saleVal === 0) {
        saleVal = (s.items || []).reduce((itemAcc, item) => {
          const price = Number(
            item.unitPrice ?? item.unit_price ?? item.price ?? 0,
          );
          const qty = Number(item.quantity ?? item.qty ?? 0);
          return itemAcc + price * qty;
        }, 0);
      }

      return acc + (isNaN(saleVal) ? 0 : saleVal);
    }, 0);

    // B. Cost of Goods Sold (COGS) using item.buyPrice or item.batch.buyPrice
    const batchCosts = sales.reduce((acc, sale) => {
      const itemsCost = (sale.items || []).reduce((itemAcc, item) => {
        const buyPrice = Number(
          item.buyPrice ?? item.batch?.buyPrice ?? item.buy_price ?? 0,
        );
        const qty = Number(item.quantity ?? item.qty ?? 0);
        return itemAcc + buyPrice * qty;
      }, 0);
      return acc + itemsCost;
    }, 0);

    // C. Combined Expenses & Profits
    const grossProfitCalc = revenue - batchCosts;
    const combinedExp = batchCosts + operationalExpenses;
    const netProfitCalc = revenue - combinedExp;

    const marginCalc = revenue > 0 ? (netProfitCalc / revenue) * 100 : 0;

    // D. Health Status Determination
    let status = "Healthy";
    let badgeStyle = "bg-white/20 text-blue-200";

    if (marginCalc < 10 && revenue > 0) {
      status = "Critical";
      badgeStyle = "bg-rose-500/30 text-rose-200";
    } else if (marginCalc < 25 && revenue > 0) {
      status = "Moderate";
      badgeStyle = "bg-amber-500/30 text-amber-200";
    } else if (revenue === 0) {
      status = "No Activity";
      badgeStyle = "bg-white/10 text-white/60";
    }

    return {
      grossSales: revenue,
      cogsAmount: batchCosts,
      totalExpenses: combinedExp,
      grossProfit: grossProfitCalc,
      netProfit: netProfitCalc,
      profitMargin: marginCalc.toFixed(1),
      healthStatus: status,
      healthBadgeStyle: badgeStyle,
    };
  }, [sales, operationalExpenses]);

  if (isLoadingSales || isLoadingExpenses) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#004ac6" />
        <Text className="text-xs text-on-surface-variant mt-3 font-semibold">
          Generating Financial Audit...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
      className="bg-background flex-1"
    >
      {/* 1. PROFIT MARGIN CARD */}
      <View className="bg-blue-900 rounded-3xl p-6 shadow-md relative overflow-hidden">
        {/* Decorative Background Circles */}
        <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <View className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-black/10" />

        {/* Header Section */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2.5">
            <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center backdrop-blur-md">
              <Percent size={20} color="#ffffff" />
            </View>
            <View>
              <Text className="text-blue-200/80 font-medium text-xs tracking-wide">
                Live Performance
              </Text>
              <Text className="text-white font-bold text-sm">
                Net Profit Margin
              </Text>
            </View>
          </View>

          {/* Dynamic Status Badge */}
          <View
            className={`px-3 py-1 rounded-full border border-white/20 ${healthBadgeStyle.split(" ")[0]}`}
          >
            <Text
              className={`text-[10px] font-extrabold uppercase tracking-widest ${healthBadgeStyle.split(" ")[1]}`}
            >
              {healthStatus}
            </Text>
          </View>
        </View>

        {/* Main Metric Display */}
        <Text className="text-white font-black text-3xl tracking-tight my-1">
          {profitMargin}%
        </Text>

        {/* Footer Breakdown */}
        <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-white/15">
          <View className="flex-row items-center gap-1.5">
            <View className="w-5 h-5 rounded-full bg-blue-400/20 items-center justify-center">
              <ArrowUpRight size={14} color="#4ade80" />
            </View>
            <Text className="text-white text-xs font-bold">
              {sales.length}{" "}
              <Text className="font-normal text-blue-200/70">
                Invoices Tracked
              </Text>
            </Text>
          </View>

          <Text className="text-blue-200/70 text-xs">Target: 35.0%</Text>
        </View>
      </View>

      {/* 2. MARGIN BREAKDOWN STACK */}
      <Text className="font-bold text-base text-on-surface mt-1">
        Real-Time Profit & Loss Analysis
      </Text>

      <View className="bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/20 shadow-xs gap-3">
        {/* Gross Revenue */}
        <View className="flex-row justify-between items-center py-1">
          <Text className="text-xs font-semibold text-on-surface-variant">
            Gross Sales Revenue
          </Text>
          <Text className="text-sm font-bold text-on-surface">
            ETB{" "}
            {grossSales.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        {/* COGS */}
        <View className="flex-row justify-between items-center py-1 border-t border-outline-variant/10">
          <Text className="text-xs font-semibold text-on-surface-variant">
            Cost of Goods Sold (COGS)
          </Text>
          <Text className="text-sm font-bold text-red-600">
            -ETB{" "}
            {cogsAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        {/* Gross Profit */}
        <View className="flex-row justify-between items-center py-1 border-t border-outline-variant/10">
          <Text className="text-xs font-bold text-on-surface">
            Gross Profit
          </Text>
          <Text className="text-sm font-bold text-emerald-600">
            ETB{" "}
            {grossProfit.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        {/* Operating Expenses */}
        <View className="flex-row justify-between items-center py-1 border-t border-outline-variant/10">
          <Text className="text-xs font-semibold text-on-surface-variant">
            Operating Expenses
          </Text>
          <Text className="text-sm font-bold text-rose-500">
            -ETB{" "}
            {operationalExpenses.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>

        {/* Net Operating Profit */}
        <View className="flex-row justify-between items-center pt-2.5 border-t border-dashed border-outline-variant/30">
          <Text className="text-sm font-extrabold text-on-surface">
            Net Operating Profit
          </Text>
          <Text
            className={`text-base font-extrabold ${
              netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            ETB{" "}
            {netProfit.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>

      {/* 3. PERFORMANCE INSIGHT TILE */}
      <View className="bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/20 shadow-xs flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-2xl bg-purple-500/10 items-center justify-center">
          <ShieldCheck size={22} color="#4f378a" />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-xs text-on-surface">
            Audit Status: Real-time Synchronized
          </Text>
          <Text className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
            Financial ledger is pulling live data from POS invoices and batch
            buying prices.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
