import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import {
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Wallet,
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  CreditCard,
  CheckCircle2,
} from "lucide-react-native";
import { LineChart, BarChart } from "react-native-gifted-charts";
import { useFinanceSummary } from "../../../hooks/useFinanceSummary";

export default function FinanceOverview() {
  const [chartType, setChartType] = useState("bar");
  const {
    sales,
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    chartData,
    isLoading,
  } = useFinanceSummary();

  const chartMaxValue = Math.max(...chartData.map((d) => d.value), 100) * 1.25;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#004ac6" />
        <Text className="text-xs text-on-surface-variant mt-3 font-semibold">
          Compiling Financial Ledgers...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 18, gap: 18, paddingBottom: 60 }}
      className="bg-background flex-1"
    >
      <View className="bg-primary rounded-3xl p-6 shadow-md relative overflow-hidden">
        <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <View className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-black/10" />

        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2.5">
            <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center backdrop-blur-md">
              <Wallet size={20} color="#ffffff" />
            </View>
            <View>
              <Text className="text-white/70 font-medium text-xs tracking-wide">
                Main Operating Cashflow
              </Text>
              <Text className="text-white font-bold text-sm">Shop Revenue</Text>
            </View>
          </View>
          <View className="bg-white/20 px-3 py-1 rounded-full border border-white/20">
            <Text className="text-[10px] font-extrabold text-white uppercase tracking-widest">
              Live Ledger
            </Text>
          </View>
        </View>

        <Text className="text-white font-black text-3xl tracking-tight my-1">
          ETB{" "}
          {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>

        <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-white/15">
          <View className="flex-row items-center gap-1.5">
            <View className="w-5 h-5 rounded-full bg-emerald-400/20 items-center justify-center">
              <ArrowUpRight size={14} color="#4ade80" />
            </View>
            <Text className="text-white text-xs font-bold">
              {profitMargin}%{" "}
              <Text className="font-normal text-white/70">Net Margin</Text>
            </Text>
          </View>
          <Text className="text-white/60 text-xs">
            {sales.length} Sales processed
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-xs justify-between">
          <View className="flex-row items-center justify-between mb-2">
            <View className="w-9 h-9 rounded-2xl bg-rose-500/10 items-center justify-center">
              <Receipt size={18} color="#e11d48" />
            </View>
          </View>
          <View>
            <Text className="text-xs font-semibold text-on-surface-variant">
              Total Expenses & COGS
            </Text>
            <Text className="font-extrabold text-base text-on-surface mt-0.5">
              ETB{" "}
              {totalExpenses.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>

        <View className="flex-1 bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20 shadow-xs justify-between">
          <View className="flex-row items-center justify-between mb-2">
            <View className="w-9 h-9 rounded-2xl bg-emerald-500/10 items-center justify-center">
              <TrendingUp size={18} color="#16a34a" />
            </View>
          </View>
          <View>
            <Text className="text-xs font-semibold text-on-surface-variant">
              Net Profit
            </Text>
            <Text className="font-extrabold text-base text-on-surface mt-0.5">
              ETB{" "}
              {netProfit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>
      </View>

      <View className="bg-surface-container-low rounded-3xl p-4 border border-outline-variant/20 shadow-xs">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="font-extrabold text-base text-on-surface">
              Cashflow Dynamics
            </Text>
            <Text className="text-xs text-on-surface-variant">
              Revenue per recent sale
            </Text>
          </View>
          <View className="flex-row bg-surface-container-highest p-1 rounded-2xl gap-1">
            <Pressable
              onPress={() => setChartType("bar")}
              className={`p-2 rounded-xl ${chartType === "bar" ? "bg-primary" : "bg-transparent"}`}
            >
              <BarChart3
                size={16}
                color={chartType === "bar" ? "#ffffff" : "#64748b"}
              />
            </Pressable>
            <Pressable
              onPress={() => setChartType("line")}
              className={`p-2 rounded-xl ${chartType === "line" ? "bg-primary" : "bg-transparent"}`}
            >
              <LineChartIcon
                size={16}
                color={chartType === "line" ? "#ffffff" : "#64748b"}
              />
            </Pressable>
          </View>
        </View>

        <View style={{ paddingVertical: 10, overflow: "visible" }}>
          {chartType === "bar" ? (
            <BarChart
              data={chartData}
              height={160}
              barWidth={22}
              initialSpacing={15}
              spacing={20}
              barBorderRadius={6}
              frontColor="#004ac6"
              maxValue={chartMaxValue}
              overflowTop={15}
              yAxisColor="transparent"
              xAxisColor="#cbd5e1"
              yAxisTextStyle={{ color: "#94a3b8", fontSize: 10 }}
              xAxisLabelTextStyle={{ color: "#64748b", fontSize: 10 }}
              noOfSections={3}
              hideRules
            />
          ) : (
            <LineChart
              data={chartData}
              height={160}
              color="#004ac6"
              thickness={3}
              curved
              areaChart
              noOfSections={3}
              spacing={42}
              initialSpacing={15}
              hideRules
              maxValue={chartMaxValue}
              overflowTop={15}
              yAxisColor="transparent"
              xAxisColor="#cbd5e1"
              yAxisTextStyle={{ color: "#94a3b8", fontSize: 10 }}
              xAxisLabelTextStyle={{ color: "#64748b", fontSize: 10 }}
              dataPointsColor="#004ac6"
              dataPointsRadius={5}
            />
          )}
        </View>
      </View>

      <View className="mt-1">
        <View className="flex-row items-center justify-between mb-3 px-1">
          <Text className="font-extrabold text-base text-on-surface">
            Recent Sales
          </Text>
          <Text className="text-xs font-semibold text-primary">
            {sales.length} Sales
          </Text>
        </View>

        <View className="gap-3">
          {sales.slice(0, 6).map((sale) => (
            <View
              key={sale.id}
              className="bg-surface-container-low rounded-2xl border border-outline-variant/20 overflow-hidden shadow-xs"
            >
              <View className="flex-row items-center justify-between bg-surface-container-highest/50 px-3.5 py-2 border-b border-outline-variant/10">
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Text className="font-bold text-xs text-on-surface">
                    Sale #{sale.id.slice(-6).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Calendar size={12} color="#64748b" />
                  <Text className="text-[11px] text-on-surface-variant font-medium">
                    {new Date(sale.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View className="p-3.5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View
                    className={`w-10 h-10 rounded-2xl items-center justify-center ${sale.status === "PAID" ? "bg-emerald-50" : "bg-blue-50"}`}
                  >
                    {sale.status === "PAID" ? (
                      <Wallet size={18} color="#16a34a" />
                    ) : (
                      <CreditCard size={18} color="#2563eb" />
                    )}
                  </View>
                  <View>
                    <Text className="font-bold text-sm text-on-surface">
                      {sale.soldBy?.name ?? "Cashier / POS"}
                    </Text>
                    <Text className="text-xs text-on-surface-variant mt-0.5">
                      {sale.customer?.name ?? "Walk-in"}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="font-black text-sm text-emerald-700">
                    +ETB{" "}
                    {Number(sale.totalAmount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <CheckCircle2
                      size={11}
                      color={sale.status === "PAID" ? "#16a34a" : "#d97706"}
                    />
                    <Text
                      className="text-[10px] font-semibold"
                      style={{
                        color: sale.status === "PAID" ? "#16a34a" : "#d97706",
                      }}
                    >
                      {sale.status}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
