import React from "react";
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

import { useShop } from "../../../hooks/useShop";
import { useAuth } from "../../../context/AuthContext";
import { useDashboard } from "../../../hooks/useDashboard";
import {
  useLowStockProducts,
  useExpiringProducts,
} from "../../../hooks/useProducts";
import { usePayments } from "../../../hooks/usePayments";
import DonutChart from "../../../components/analytics/DonutChart";
import ChartCard from "../../../components/analytics/ChartCard";
import TrialBanner from "../../../components/overview/TrialBanner";
import QuickAction from "../../../components/overview/QuickAction";
import AlertRow from "../../../components/overview/AlertRow";

const PAYMENT_COLORS = {
  CASH: "#004ac6",
  BANK_TRANSFER: "#565e74",
  MOBILE_MONEY: "#10b981",
  CHEQUE: "#b45309",
  OTHER: "#94a3b8",
};

const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function OverviewPage() {
  const [activeAlertTab, setActiveAlertTab] = React.useState("lowStock");

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const { shop } = useShop();
  const { user } = useAuth();
  const { data: dashboard } = useDashboard();
  const { data: lowStockData } = useLowStockProducts();
  const { data: expiringData } = useExpiringProducts(30);
  const { data: todayPayments } = usePayments({
    type: "CUSTOMER_PAYMENT",
    from: todayStart.toISOString(),
    to: now.toISOString(),
    limit: 100,
  });

  const salesToday = Number(dashboard?.sales ?? 0);
  const moneyReceivedToday = Number(dashboard?.moneyReceived ?? 0);
  const customersOwe = Number(dashboard?.customersOwe ?? 0);
  const lowStockList = lowStockData?.items ?? [];
  const expiringList = expiringData?.items ?? [];
  const alertCount =
    Number(dashboard?.lowStock ?? 0) + Number(dashboard?.expiringSoon ?? 0);

  // Payment-method mix for today, built from today's customer payments —
  // there's no server-side breakdown endpoint, so it's grouped here.
  const byPayment = (todayPayments?.items ?? []).reduce((acc, p) => {
    acc[p.method] = (acc[p.method] ?? 0) + Number(p.amount);
    return acc;
  }, {});
  const paymentEntries = Object.entries(byPayment);
  const paymentTotal = paymentEntries.reduce((sum, [, v]) => sum + v, 0);
  const paymentData = paymentEntries.map(([method, amount]) => ({
    label: method.replace("_", " "),
    percent: paymentTotal > 0 ? Math.round((amount / paymentTotal) * 100) : 0,
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
      {shop?.subscriptionStatus === "TRIAL" && (
        <TrialBanner trialEnd={shop.trialEnd} />
      )}

      {/* 2. Shop Profile Header */}
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
                  {shop?.name || "My Shop"}
                </Text>
                <View className="bg-emerald/10 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <Text className="text-[10px] font-semibold text-emerald-700 uppercase">
                    Active
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-on-surface-variant">
                {todayLabel} • Welcome back, {user?.name || "there"}
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
            {customersOwe.toLocaleString()} ETB owed by customers
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
          {salesToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>

        <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-white/15">
          <View className="flex-row items-center gap-1.5">
            <View className="w-5 h-5 rounded-full bg-emerald-400/20 items-center justify-center">
              <TrendingUp size={14} color="#4ade80" />
            </View>
            <Text className="text-white text-xs font-bold">
              ETB {moneyReceivedToday.toLocaleString()}{" "}
              <Text className="font-normal text-white/70">received today</Text>
            </Text>
          </View>

          <Text className="text-white/60 text-xs">
            ETB {Number(dashboard?.creditSales ?? 0).toLocaleString()} on credit
          </Text>
        </View>
      </View>

      {/* 4. Secondary Metrics Grid */}
      <View className="flex-row gap-3">
        {/* Expenses today */}
        <View className="flex-1 bg-primary p-4 rounded-3xl shadow-md relative overflow-hidden justify-between min-h-[135px]">
          <View className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
          <View className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-black/10" />

          <View className="flex-row items-center justify-between">
            <View className="w-8 h-8 rounded-xl bg-white/20 items-center justify-center backdrop-blur-md">
              <Wallet size={16} color="#ffffff" />
            </View>
            <View className="bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
              <Text className="text-[10px] font-extrabold text-white uppercase tracking-wider">
                TODAY
              </Text>
            </View>
          </View>

          <View className="mt-2">
            <Text className="text-white/70 text-[11px] font-medium tracking-wide">
              Expenses
            </Text>
            <Text
              className="font-black text-lg text-white tracking-tight"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              ETB {Number(dashboard?.expenses ?? 0).toLocaleString()}
            </Text>
            <Text
              className="text-[11px] text-white/70 font-semibold mt-0.5"
              numberOfLines={1}
            >
              Suppliers owed: ETB{" "}
              {Number(dashboard?.suppliersOwe ?? 0).toLocaleString()}
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
                alertCount > 0 ? "bg-rose-500/30" : "bg-white/20"
              }`}
            >
              <AlertTriangle
                size={16}
                color={alertCount > 0 ? "#fca5a5" : "#ffffff"}
              />
            </View>

            <View
              className={`px-2 py-0.5 rounded-full border ${
                alertCount > 0
                  ? "bg-rose-500/30 border-rose-300/40"
                  : "bg-white/20 border-white/20"
              }`}
            >
              <Text
                className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  alertCount > 0 ? "text-rose-200" : "text-white"
                }`}
              >
                {alertCount > 0 ? "Action Needed" : "Healthy"}
              </Text>
            </View>
          </View>

          <View className="mt-2">
            <Text className="text-white/70 text-[11px] font-medium tracking-wide">
              Inventory Alerts
            </Text>
            <Text className="font-black text-2xl text-white tracking-tight">
              {alertCount}
            </Text>
            <Text
              className={`text-[11px] font-semibold mt-0.5 ${
                alertCount > 0 ? "text-rose-200" : "text-emerald-300"
              }`}
              numberOfLines={1}
            >
              {alertCount > 0
                ? `${dashboard?.lowStock ?? 0} low stock · ${dashboard?.expiringSoon ?? 0} expiring`
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
            label="Add Product"
            iconColor="#004ac6"
            iconBgClassName="bg-primary/10"
            onPress={() => router.push("(app)/inventory/products")}
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
            onPress={() => router.push("(app)/inventory/products")}
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
              lowStockList
                .slice(0, 5)
                .map((p) => (
                  <AlertRow
                    key={p.id}
                    icon={PackageMinus}
                    tone="warning"
                    title={p.name}
                    subtitle={`Reorder threshold: ${p.minQuantityAlert}`}
                    trailing={`${p.quantity} ${p.unitType?.toLowerCase() ?? ""}`}
                    onPress={() => router.push("(app)/inventory/products")}
                  />
                ))
            )}
          </View>
        )}

        {/* Tab 2: Expiring Products */}
        {activeAlertTab === "expiring" && (
          <View className="gap-2">
            {expiringList.length === 0 ? (
              <View className="items-center py-6 gap-2">
                <View className="w-10 h-10 rounded-full bg-emerald/10 items-center justify-center">
                  <PartyPopper size={18} color="#10b981" />
                </View>
                <Text className="text-xs text-on-surface-variant font-medium">
                  No products expiring in the next 30 days
                </Text>
              </View>
            ) : (
              expiringList
                .slice(0, 5)
                .map((p) => (
                  <AlertRow
                    key={p.id}
                    icon={Clock3}
                    tone="error"
                    title={p.name}
                    subtitle={`Expiry: ${new Date(p.expiryDate).toLocaleDateString()}`}
                    trailing={`${p.quantity} units`}
                  />
                ))
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
