import { useState, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Stack } from "expo-router";
import {
  Boxes,
  ShoppingCart,
  Package2,
  Coins,
  TrendingUp,
  AlertTriangle,
  Award,
} from "lucide-react-native";

import { useBatches } from "../../../hooks/useBatches";
import { useMedicines } from "../../../hooks/useMedicines";
import { useSuppliers } from "../../../hooks/useSuppliers";

import PillTabs from "../../../components/common/PillTabs";
import KPICard from "../../../components/analytics/KPICard";
import { ChartCard } from "../../../components/ChartCard"; // Using the updated ChartCard component

const DATE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "All Time", value: "all" },
];

export default function AnalyticsScreen() {
  const [dateRange, setDateRange] = useState("30d");

  // Fetch real data from hooks
  const { data: batchesData, isLoading: loadingBatches } = useBatches({});
  const { data: medicinesData, isLoading: loadingMeds } = useMedicines({
    limit: 100,
  });
  const { data: suppliersData } = useSuppliers({ limit: 50 });

  const batches = useMemo(() => batchesData?.batches ?? [], [batchesData]);
  const medicines = useMemo(
    () => medicinesData?.medicines ?? [],
    [medicinesData],
  );
  const suppliers = useMemo(
    () => suppliersData?.suppliers ?? [],
    [suppliersData],
  );

  // Real Metric Calculations
  const metrics = useMemo(() => {
    let totalValue = 0;
    let totalStockUnits = 0;
    let totalProfitPotential = 0;
    let lowStockCount = 0;

    batches.forEach((b) => {
      const qty = Number(b.quantity || 0);
      const buy = Number(b.buyPrice || 0);
      const sell = Number(b.sellPrice || 0);

      totalValue += qty * buy;
      totalStockUnits += qty;
      totalProfitPotential += qty * (sell - buy);

      if (qty <= 15) {
        lowStockCount += 1;
      }
    });

    const avgMargin =
      totalValue > 0
        ? (
            (totalProfitPotential / (totalValue + totalProfitPotential)) *
            100
          ).toFixed(1)
        : "0.0";

    return {
      totalValue,
      totalStockUnits,
      totalProfitPotential,
      avgMargin,
      lowStockCount,
      totalMedicines: medicines.length,
      totalSuppliers: suppliers.length,
    };
  }, [batches, medicines, suppliers]);

  // Derive Top-Selling / High-Value Batches from Real Data
  const topBatches = useMemo(() => {
    return [...batches]
      .sort((a, b) => {
        const valA = Number(a.quantity || 0) * Number(a.sellPrice || 0);
        const valB = Number(b.quantity || 0) * Number(b.sellPrice || 0);
        return valB - valA;
      })
      .slice(0, 5);
  }, [batches]);

  // Construct chart series dynamically using real batch dates/prices
  const chartSeries = useMemo(() => {
    if (batches.length === 0) {
      return [
        {
          key: "value",
          label: "Inventory Value",
          color: "#004ac6",
          lightColor: "#dbe2f9",
          data: [{ value: 0, label: "Start" }],
          formatValue: (v) => `ETB ${v.toLocaleString()}`,
        },
      ];
    }

    const samplePoints = batches.slice(0, 6).map((b, idx) => ({
      value: Number(b.quantity || 0) * Number(b.sellPrice || 0),
      label: `B-${idx + 1}`,
    }));

    const marginPoints = batches.slice(0, 6).map((b, idx) => ({
      value: Math.max(
        0,
        (Number(b.sellPrice || 0) - Number(b.buyPrice || 0)) *
          Number(b.quantity || 0),
      ),
      label: `B-${idx + 1}`,
    }));

    return [
      {
        key: "revenue",
        label: "Stock Asset Value",
        color: "#004ac6",
        lightColor: "#dbe2f9",
        data: samplePoints,
        formatValue: (v) => `ETB ${v.toLocaleString()}`,
      },
      {
        key: "profit",
        label: "Projected Profit",
        color: "#16a34a",
        lightColor: "#dcfce7",
        data: marginPoints,
        formatValue: (v) => `ETB ${v.toLocaleString()}`,
      },
    ];
  }, [batches]);

  if (loadingBatches || loadingMeds) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#004ac6" />
        <Text className="mt-3 text-sm text-on-surface-variant font-medium">
          Loading analytics...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        className="px-4"
      >
        {/* Date Filter Bar */}
        <View className="mt-4 mb-4">
          <PillTabs
            options={DATE_OPTIONS}
            value={dateRange}
            onChange={setDateRange}
          />
        </View>

        {/* Hero KPI Summary Matrix */}
        <View className="flex-col flex-wrap gap-3 mb-6">
          <KPICard
            label="Total Inventory Value"
            value={`ETB ${metrics.totalValue.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}`}
            icon={Boxes}
            iconColor="#004ac6"
            iconBgClassName="bg-primary/10"
            trend="up"
            trendText={`${metrics.totalStockUnits.toLocaleString()} total units`}
          />

          <KPICard
            label="Projected Profit"
            value={`ETB ${metrics.totalProfitPotential.toLocaleString(
              undefined,
              {
                maximumFractionDigits: 0,
              },
            )}`}
            icon={Coins}
            iconColor="#16a34a"
            iconBgClassName="bg-emerald-50"
            trend="up"
            trendText={`${metrics.avgMargin}% est. margin`}
          />

          <KPICard
            label="Active Formulations"
            value={String(metrics.totalMedicines)}
            icon={Package2}
            iconColor="#8b5cf6"
            iconBgClassName="bg-purple-50"
            trendText={`Sourced from ${metrics.totalSuppliers} suppliers`}
          />

          <KPICard
            label="Low Stock Alerts"
            value={String(metrics.lowStockCount)}
            icon={AlertTriangle}
            iconColor="#eab308"
            iconBgClassName="bg-amber-50"
            trendText={
              metrics.lowStockCount > 0
                ? "Requires stock replenishment"
                : "Inventory healthy"
            }
          />
        </View>

        {/* Interactive Dynamic Multi-Series Trend Chart */}
        <View className="mb-6">
          <ChartCard
            title="Financial & Stock Asset Projections"
            series={chartSeries}
          />
        </View>

        {/* Highest Capital Allocation Batches Section */}
        <View className="bg-surface-container-low rounded-3xl p-5 border border-outline-variant/20 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Award size={20} color="#004ac6" />
              <Text className="font-bold text-base text-on-surface">
                Highest Value Batches
              </Text>
            </View>
            <Text className="text-xs font-semibold text-primary">
              Top Assets
            </Text>
          </View>

          {topBatches.length === 0 ? (
            <Text className="text-sm text-on-surface-variant italic py-4 text-center">
              No active batches registered.
            </Text>
          ) : (
            <View className="gap-3">
              {topBatches.map((item, idx) => {
                const totalAssetValue =
                  Number(item.quantity || 0) * Number(item.sellPrice || 0);

                return (
                  <View
                    key={item.id ?? idx}
                    className="flex-row items-center justify-between p-3 rounded-2xl bg-surface border border-outline-variant/10"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                        <Text className="font-bold text-xs text-primary">
                          #{idx + 1}
                        </Text>
                      </View>

                      <View>
                        <Text className="font-bold text-sm text-on-surface">
                          {item.medicine?.name ?? "Unknown Medicine"}
                        </Text>
                        <Text className="text-xs text-on-surface-variant">
                          Batch: {item.batchNumber} • {item.quantity} units left
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="font-bold text-sm text-on-surface">
                        ETB {totalAssetValue.toLocaleString()}
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <TrendingUp size={12} color="#16a34a" />
                        <Text className="text-[10px] font-semibold text-emerald-600">
                          Cost ETB {item.buyPrice}/u
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
