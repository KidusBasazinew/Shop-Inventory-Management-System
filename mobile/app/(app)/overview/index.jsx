import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import {
  CoinsIcon,
  Wallet,
  AlertTriangle,
  Plus,
  Receipt,
  BarChart3,
  PackageMinus,
  Clock3,
  PartyPopper,
  Building2,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from "lucide-react-native";

// Temporarily disabled: dashboard data hooks are not available in this checkout.
// import { useUser } from "../../../hooks/useUser";
// import { useDailyReport, useProfitReport } from "../../../hooks/useSales";
// import { useLowStockMedicines, useMedicines } from "../../../hooks/useMedicines";
// import { useExpiringBatches } from "../../../hooks/useBatches";
import DonutChart from "../../../components/analytics/DonutChart";
import ChartCard from "../../../components/analytics/ChartCard";
import TrialBanner from "../../../components/overview/TrialBanner";
import QuickAction from "../../../components/overview/QuickAction";
import AlertRow from "../../../components/overview/AlertRow";

const emptyQuery = () => ({ data: undefined });
const useUser = () => ({ pharmacy: null, user: null });
const useDailyReport = emptyQuery;
const useProfitReport = emptyQuery;
const useLowStockMedicines = emptyQuery;
const useMedicines = emptyQuery;
const useExpiringBatches = emptyQuery;

const PAYMENT_COLORS = {
  CASH: "#004ac6",
  TELEBIRR: "#10b981",
  BANK: "#565e74",
  CBE_BIRR: "#b45309",
  CREDIT: "#ba1a1a",
};

const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function OverviewPage() {
  const [activeAlertTab, setActiveAlertTab] = useState("lowStock");

  const now = new Date();
  const todayStr = formatLocalDate(now);
  console.log("OVERVIEW todayStr:", todayStr, "raw now:", now.toString());
  const startOfMonthStr = formatLocalDate(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );

  const { pharmacy, user } = useUser();
  const { data: rawDailyReport } = useDailyReport(todayStr);
  const { data: rawProfitReport } = useProfitReport(startOfMonthStr, todayStr);
  const { data: lowStockData } = useLowStockMedicines();
  const { data: expiringData } = useExpiringBatches(60);
  const { data: medicinesData } = useMedicines({ page: 1, limit: 10 });

  // Handle both standard axios response structure { data: { ... } } and raw payload
  const dailyReport = rawDailyReport?.data ?? rawDailyReport ?? {};
  const profitReport = rawProfitReport?.data ?? rawProfitReport ?? {};

  // Safely extract report metrics
  const todayRevenue = Number(dailyReport?.totalRevenue ?? 0);
  const transactionCount = Number(dailyReport?.transactionCount ?? 0);
  const monthlyNetProfit = Number(profitReport?.netProfit ?? 0);
  const unitsSold = Number(profitReport?.unitsSold ?? 0);

  const lowStockList = lowStockData ?? [];
  const expiringList = expiringData ?? [];
  const totalMedicines = medicinesData?.total ?? 0;

  // Build chart metrics
  const byPayment = dailyReport?.byPaymentMethod ?? {};
  const paymentEntries = Object.entries(byPayment);
  const paymentTotal = paymentEntries.reduce(
    (sum, [, v]) => sum + Number(v),
    0,
  );
  const paymentData = paymentEntries.map(([method, amount]) => ({
    label: method.replace("_", " "),
    percent:
      paymentTotal > 0 ? Math.round((Number(amount) / paymentTotal) * 100) : 0,
    color: PAYMENT_COLORS[method] ?? "#94a3b8",
  }));

  const todayLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 18 }}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Trial Status Banner */}
      {pharmacy?.subscriptionStatus === "TRIAL" && (
        <TrialBanner trialEnd={pharmacy.trialEnd} />
      )}

      {/* 2. Pharmacy Profile Header */}
      <View className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/30 shadow-xs gap-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center border border-primary/20">
              <Building2 size={24} color="#004ac6" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  className="text-lg font-bold text-on-surface"
                  numberOfLines={1}
                >
                  {pharmacy?.name || "My Pharmacy"}
                </Text>
                <View className="bg-emerald/10 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <Text className="text-[10px] font-semibold text-emerald-700 uppercase">
                    Active
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-on-surface-variant">
                {todayLabel} • Welcome back, {user?.name || "Pharmacist"}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center justify-between bg-surface-container-low p-3 rounded-2xl border border-outline-variant/15">
          <View className="flex-row items-center gap-2">
            <CheckCircle2 size={16} color="#10b981" />
            <Text className="text-xs font-medium text-on-surface">
              System Ready
            </Text>
          </View>
          <Text className="text-xs text-on-surface-variant font-medium">
            {totalMedicines} Products Cataloged
          </Text>
        </View>
      </View>

      {/* 3. Today's Revenue Card */}
      <View className="bg-primary rounded-3xl p-6 shadow-md relative overflow-hidden">
        <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <View className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-black/10" />

        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2.5">
            <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center backdrop-blur-md">
              <CoinsIcon size={20} color="#ffffff" />
            </View>
            <View>
              <Text className="text-white/70 font-medium text-xs tracking-wide">
                Main Revenue Stream
              </Text>
              <Text className="text-white font-bold text-sm">
                Today's Sales Revenue
              </Text>
            </View>
          </View>

          <View className="bg-white/20 px-3 py-1 rounded-full border border-white/20">
            <Text className="text-[10px] font-extrabold text-white uppercase tracking-widest">
              Live Sales
            </Text>
          </View>
        </View>

        <Text className="text-white font-black text-3xl tracking-tight my-1">
          ETB{" "}
          {todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>

        <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-white/15">
          <View className="flex-row items-center gap-1.5">
            <View className="w-5 h-5 rounded-full bg-emerald-400/20 items-center justify-center">
              <TrendingUp size={14} color="#4ade80" />
            </View>
            <Text className="text-white text-xs font-bold">
              ETB {monthlyNetProfit.toLocaleString()}{" "}
              <Text className="font-normal text-white/70">MTD Net Profit</Text>
            </Text>
          </View>

          <Text className="text-white/60 text-xs">
            {transactionCount} Completed{" "}
            {transactionCount === 1 ? "Sale" : "Sales"}
          </Text>
        </View>
      </View>

      {/* 4. Secondary Metrics Grid */}
      <View className="flex-row gap-3">
        {/* MTD Profit Card */}
        <View className="flex-1 bg-primary p-4 rounded-3xl shadow-md relative overflow-hidden justify-between min-h-[135px]">
          <View className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
          <View className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-black/10" />

          <View className="flex-row items-center justify-between">
            <View className="w-8 h-8 rounded-xl bg-white/20 items-center justify-center backdrop-blur-md">
              <Wallet size={16} color="#ffffff" />
            </View>
            <View className="bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
              <Text className="text-[10px] font-extrabold text-white uppercase tracking-wider">
                MTD
              </Text>
            </View>
          </View>

          <View className="mt-2">
            <Text className="text-white/70 text-[11px] font-medium tracking-wide">
              Monthly Net Profit
            </Text>
            <Text
              className="font-black text-lg text-white tracking-tight"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              ETB {monthlyNetProfit.toLocaleString()}
            </Text>
            <Text
              className="text-[11px] text-white/70 font-semibold mt-0.5"
              numberOfLines={1}
            >
              ↑ {unitsSold} units sold
            </Text>
          </View>
        </View>

        {/* Inventory Alert Card */}
        <View className="flex-1 bg-primary p-4 rounded-3xl shadow-md relative overflow-hidden justify-between min-h-[135px]">
          <View className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
          <View className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-black/10" />

          <View className="flex-row items-center justify-between">
            <View
              className={`w-8 h-8 rounded-xl items-center justify-center backdrop-blur-md ${
                lowStockList.length + expiringList.length > 0
                  ? "bg-rose-500/30"
                  : "bg-white/20"
              }`}
            >
              <AlertTriangle
                size={16}
                color={
                  lowStockList.length + expiringList.length > 0
                    ? "#fca5a5"
                    : "#ffffff"
                }
              />
            </View>

            <View
              className={`px-2 py-0.5 rounded-full border ${
                lowStockList.length + expiringList.length > 0
                  ? "bg-rose-500/30 border-rose-300/40"
                  : "bg-white/20 border-white/20"
              }`}
            >
              <Text
                className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  lowStockList.length + expiringList.length > 0
                    ? "text-rose-200"
                    : "text-white"
                }`}
              >
                {lowStockList.length + expiringList.length > 0
                  ? "Action Needed"
                  : "Healthy"}
              </Text>
            </View>
          </View>

          <View className="mt-2">
            <Text className="text-white/70 text-[11px] font-medium tracking-wide">
              Inventory Alerts
            </Text>
            <Text className="font-black text-2xl text-white tracking-tight">
              {lowStockList.length + expiringList.length}
            </Text>
            <Text
              className={`text-[11px] font-semibold mt-0.5 ${
                lowStockList.length + expiringList.length > 0
                  ? "text-rose-200"
                  : "text-emerald-300"
              }`}
              numberOfLines={1}
            >
              {lowStockList.length + expiringList.length > 0
                ? `${lowStockList.length} low stock · ${expiringList.length} expiring`
                : "All stock healthy"}
            </Text>
          </View>
        </View>
      </View>

      {/* 5. Quick Actions */}
      <View className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-4">
        <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">
          Quick Actions
        </Text>
        <View className="flex-row justify-between">
          <QuickAction
            icon={Receipt}
            label="New Sale"
            iconColor="#10b981"
            iconBgClassName="bg-emerald/15"
            onPress={() => router.push("(app)/finance/sales")}
          />
          <QuickAction
            icon={Plus}
            label="Add Medicine"
            iconColor="#004ac6"
            iconBgClassName="bg-primary/10"
            onPress={() => router.push("(app)/inventory/medicines")}
          />
          <QuickAction
            icon={BarChart3}
            label="Analytics"
            iconColor="#565e74"
            iconBgClassName="bg-secondary-container/60"
            onPress={() => router.push("(app)/overview/analytics")}
          />
        </View>
      </View>

      {/* 6. Payment Breakdown Chart */}
      {paymentData.length > 0 && (
        <ChartCard title="Today's Payment Mix">
          <DonutChart
            data={paymentData}
            totalValue={`ETB ${paymentTotal.toLocaleString()}`}
          />
        </ChartCard>
      )}

      {/* 7. Alert Center */}
      <View className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-4 gap-3">
        <View className="flex-row items-center justify-between border-b border-outline-variant/20 pb-3">
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setActiveAlertTab("lowStock")}
              className={`px-3 py-1.5 rounded-full ${
                activeAlertTab === "lowStock"
                  ? "bg-primary"
                  : "bg-surface-container-low"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeAlertTab === "lowStock"
                    ? "text-white"
                    : "text-on-surface-variant"
                }`}
              >
                Low Stock ({lowStockList.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveAlertTab("expiring")}
              className={`px-3 py-1.5 rounded-full ${
                activeAlertTab === "expiring"
                  ? "bg-primary"
                  : "bg-surface-container-low"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeAlertTab === "expiring"
                    ? "text-white"
                    : "text-on-surface-variant"
                }`}
              >
                Expiring ({expiringList.length})
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push("(app)/inventory/medicines")}
            className="flex-row items-center gap-0.5"
          >
            <Text className="text-xs font-medium text-primary">View All</Text>
            <ChevronRight size={14} color="#004ac6" />
          </Pressable>
        </View>

        {/* Tab 1: Low Stock Items */}
        {activeAlertTab === "lowStock" && (
          <View className="gap-2">
            {lowStockList.length === 0 ? (
              <View className="items-center py-6 gap-2">
                <View className="w-10 h-10 rounded-full bg-emerald/10 items-center justify-center">
                  <PartyPopper size={18} color="#10b981" />
                </View>
                <Text className="text-xs text-on-surface-variant font-medium">
                  All inventory levels are healthy
                </Text>
              </View>
            ) : (
              lowStockList.slice(0, 5).map((m) => (
                <AlertRow
                  key={m.id}
                  icon={PackageMinus}
                  tone="warning"
                  title={m.name}
                  subtitle={`Reorder threshold: ${m.reorderLevel}`}
                  trailing={`${m.currentStock ?? m.quantity ?? 0} ${m.unit ?? ""}`}
                  onPress={() =>
                    router.push({
                      pathname: "(app)/inventory/medicine-batches",
                      params: { medicineId: m.id, medicineName: m.name },
                    })
                  }
                />
              ))
            )}
          </View>
        )}

        {/* Tab 2: Expiring Batches */}
        {activeAlertTab === "expiring" && (
          <View className="gap-2">
            {expiringList.length === 0 ? (
              <View className="items-center py-6 gap-2">
                <View className="w-10 h-10 rounded-full bg-emerald/10 items-center justify-center">
                  <PartyPopper size={18} color="#10b981" />
                </View>
                <Text className="text-xs text-on-surface-variant font-medium">
                  No medicine batches expiring in the next 60 days
                </Text>
              </View>
            ) : (
              expiringList
                .slice(0, 5)
                .map((b) => (
                  <AlertRow
                    key={b.id}
                    icon={Clock3}
                    tone="error"
                    title={b.medicineName ?? b.batchNumber}
                    subtitle={`Batch ${b.batchNumber} · Expiry: ${new Date(
                      b.expiryDate,
                    ).toLocaleDateString()}`}
                    trailing={`${b.quantity} units`}
                  />
                ))
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
