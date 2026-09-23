import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Search, Package, AlertTriangle, Clock } from "lucide-react-native";
import {
  useProducts,
  useLowStockProducts,
  useExpiringProducts,
} from "../../../hooks/useProducts";
import InventoryStockCard from "../../../components/inventory/InventoryStockCard";

export default function InventoryScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const { filter } = useLocalSearchParams();
  const [selectedFilter, setSelectedFilter] = useState(
    filter === "expiringSoon" ? "EXPIRING" : "ALL",
  );

  const { data: productsData, isLoading: productsLoading } = useProducts({
    search: searchQuery,
    limit: 100,
  });
  const { data: lowStockData, isLoading: lowStockLoading } =
    useLowStockProducts();
  const { data: expiringData, isLoading: expiringLoading } =
    useExpiringProducts(30);

  const isLoading = productsLoading || lowStockLoading || expiringLoading;

  const lowStockIds = useMemo(
    () => new Set((lowStockData?.items ?? []).map((p) => p.id)),
    [lowStockData],
  );
  const expiringIds = useMemo(
    () => new Set((expiringData?.items ?? []).map((p) => p.id)),
    [expiringData],
  );

  const merged = useMemo(() => {
    return (productsData?.items ?? []).map((p) => ({
      ...p,
      isExpiringSoon: expiringIds.has(p.id),
    }));
  }, [productsData, expiringIds]);

  const stats = useMemo(
    () => ({
      total: productsData?.total ?? merged.length,
      lowStock: lowStockIds.size,
      expiring: expiringIds.size,
    }),
    [productsData, lowStockIds, expiringIds],
  );

  const filtered = useMemo(() => {
    if (selectedFilter === "LOW_STOCK")
      return merged.filter((p) => lowStockIds.has(p.id));
    if (selectedFilter === "EXPIRING")
      return merged.filter((p) => p.isExpiringSoon);
    return merged;
  }, [merged, selectedFilter, lowStockIds]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#004ac6" />
        <Text className="text-xs text-on-surface-variant mt-3 font-semibold">
          Loading inventory...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="p-5 pb-3 bg-surface-container-lowest border-b border-outline-variant/15 gap-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-on-surface">
              Stock Overview
            </Text>
            <Text className="text-xs text-on-surface-variant">
              Manage stock levels and expiring products
            </Text>
          </View>
        </View>

        <View className="flex-row items-center bg-surface-container-high/60 px-3.5 py-2.5 rounded-2xl border border-outline-variant/20 gap-2.5">
          <Search size={18} color="#666" />
          <TextInput
            placeholder="Search product name..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-sm text-on-surface p-0"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          <Pressable
            onPress={() => setSelectedFilter("ALL")}
            className={`px-4 py-1.5 rounded-full border ${selectedFilter === "ALL" ? "bg-primary border-primary" : "bg-surface-container-low border-outline-variant/20"}`}
          >
            <Text
              className={`text-xs font-bold ${selectedFilter === "ALL" ? "text-white" : "text-on-surface-variant"}`}
            >
              All ({stats.total})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedFilter("LOW_STOCK")}
            className={`px-4 py-1.5 rounded-full border flex-row items-center gap-1.5 ${selectedFilter === "LOW_STOCK" ? "bg-amber-500 border-amber-500" : "bg-surface-container-low border-outline-variant/20"}`}
          >
            <AlertTriangle
              size={12}
              color={selectedFilter === "LOW_STOCK" ? "#ffffff" : "#d97706"}
            />
            <Text
              className={`text-xs font-bold ${selectedFilter === "LOW_STOCK" ? "text-white" : "text-amber-700"}`}
            >
              Low Stock ({stats.lowStock})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedFilter("EXPIRING")}
            className={`px-4 py-1.5 rounded-full border flex-row items-center gap-1.5 ${selectedFilter === "EXPIRING" ? "bg-rose-500 border-rose-500" : "bg-surface-container-low border-outline-variant/20"}`}
          >
            <Clock
              size={12}
              color={selectedFilter === "EXPIRING" ? "#ffffff" : "#e11d48"}
            />
            <Text
              className={`text-xs font-bold ${selectedFilter === "EXPIRING" ? "text-white" : "text-rose-700"}`}
            >
              Expiring Soon ({stats.expiring})
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-12 gap-3">
            <Package size={48} color="#aaa" />
            <Text className="text-on-surface-variant font-medium text-sm">
              No inventory matches your criteria.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <InventoryStockCard
            product={item}
            onPress={() => router.push("(app)/inventory/products")}
          />
        )}
      />
    </View>
  );
}
