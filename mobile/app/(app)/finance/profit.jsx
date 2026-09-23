import React from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { ShieldCheck, Percent, ArrowUpRight } from "lucide-react-native";
import { useFinanceSummary } from "../../../hooks/useFinanceSummary";

export default function FinanceProfit() {
  const {
    sales,
    totalRevenue,
    cogsAmount,
    operationalExpenses,
    grossProfit,
    netProfit,
    profitMargin,
    isLoading,
  } = useFinanceSummary();

  const marginNum = Number(profitMargin);
  let healthStatus = "Healthy";
  let healthBadgeStyle = "bg-white/20 text-blue-200";
  if (totalRevenue === 0) {
    healthStatus = "No Activity";
    healthBadgeStyle = "bg-white/10 text-white/60";
  } else if (marginNum < 10) {
    healthStatus = "Critical";
    healthBadgeStyle = "bg-rose-500/30 text-rose-200";
  } else if (marginNum < 25) {
    healthStatus = "Moderate";
    healthBadgeStyle = "bg-amber-500/30 text-amber-200";
  }

  if (isLoading) {
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
      <View className="bg-blue-900 rounded-3xl p-6 shadow-md relative overflow-hidden">
        <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <View className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-black/10" />

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

        <Text className="text-white font-black text-3xl tracking-tight my-1">
          {profitMargin}%
        </Text>

        <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-white/15">
          <View className="flex-row items-center gap-1.5">
            <View className="w-5 h-5 rounded-full bg-blue-400/20 items-center justify-center">
              <ArrowUpRight size={14} color="#4ade80" />
            </View>
            <Text className="text-white text-xs font-bold">
              {sales.length}{" "}
              <Text className="font-normal text-blue-200/70">
                Sales Tracked
              </Text>
            </Text>
          </View>
        </View>
      </View>

      <Text className="font-bold text-base text-on-surface mt-1">
        Real-Time Profit & Loss Analysis
      </Text>

      <View className="bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/20 shadow-xs gap-3">
        <View className="flex-row justify-between items-center py-1">
          <Text className="text-xs font-semibold text-on-surface-variant">
            Gross Sales Revenue
          </Text>
          <Text className="text-sm font-bold text-on-surface">
            ETB{" "}
            {totalRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>

        <View className="flex-row justify-between items-center py-1 border-t border-outline-variant/10">
          <Text className="text-xs font-semibold text-on-surface-variant">
            Cost of Goods Sold (COGS)
          </Text>
          <Text className="text-sm font-bold text-red-600">
            -ETB{" "}
            {cogsAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View className="flex-row justify-between items-center py-1 border-t border-outline-variant/10">
          <Text className="text-xs font-bold text-on-surface">
            Gross Profit
          </Text>
          <Text className="text-sm font-bold text-emerald-600">
            ETB{" "}
            {grossProfit.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>

        <View className="flex-row justify-between items-center py-1 border-t border-outline-variant/10">
          <Text className="text-xs font-semibold text-on-surface-variant">
            Operating Expenses
          </Text>
          <Text className="text-sm font-bold text-rose-500">
            -ETB{" "}
            {operationalExpenses.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>

        <View className="flex-row justify-between items-center pt-2.5 border-t border-dashed border-outline-variant/30">
          <Text className="text-sm font-extrabold text-on-surface">
            Net Operating Profit
          </Text>
          <Text
            className={`text-base font-extrabold ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}
          >
            ETB{" "}
            {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      <View className="bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/20 shadow-xs flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-2xl bg-purple-500/10 items-center justify-center">
          <ShieldCheck size={22} color="#4f378a" />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-xs text-on-surface">
            Audit Status: Real-time Synchronized
          </Text>
          <Text className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
            COGS is estimated from each product's current buying price — not a
            historical cost snapshot.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
