import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  AlertTriangle,
  ArrowLeftRight,
  ShoppingCart,
  Inbox,
  ShieldAlert,
  Calendar,
  Hash,
} from "lucide-react-native";
import { useAuth } from "../../../context/AuthContext";
// Temporarily disabled: activity hooks are not available in this checkout.
// import { useInventoryMovements } from "../../../hooks/useInventoryMovements";

const MOVEMENT_TYPES = [
  "PURCHASE",
  "SALE",
  "ADJUSTMENT",
  "EXPIRED",
  "RETURN",
  "TRANSFER",
];

const TYPE_CONFIG = {
  PURCHASE: {
    icon: ArrowDownCircle,
    color: "#059669",
    pillarBg: "bg-green-500/20",
    badgeBg: "bg-emerald-500/15",
    label: "Purchase",
    tag: "Stock In",
  },
  SALE: {
    icon: ShoppingCart,
    color: "#004ac6",
    pillarBg: "bg-blue-500/20",
    badgeBg: "bg-blue-500/15",
    label: "Sale",
    tag: "Stock Out",
  },
  ADJUSTMENT: {
    icon: RotateCcw,
    color: "#d97706",
    pillarBg: "bg-orange-500/20",
    badgeBg: "bg-amber-500/15",
    label: "Adjustment",
    tag: "Correction",
  },
  EXPIRED: {
    icon: AlertTriangle,
    color: "#ba1a1a",
    pillarBg: "bg-red-500/20",
    badgeBg: "bg-red-500/15",
    label: "Expired",
    tag: "Disposal",
  },
  RETURN: {
    icon: ArrowUpCircle,
    color: "#059669",
    pillarBg: "bg-emerald-500/20",
    badgeBg: "bg-emerald-500/15",
    label: "Return",
    tag: "Stock In",
  },
  TRANSFER: {
    icon: ArrowLeftRight,
    color: "#625b71",
    pillarBg: "bg-slate-500/20",
    badgeBg: "bg-slate-500/15",
    label: "Transfer",
    tag: "Relocation",
  },
};

// Isolated Filter Chip component prevents NativeWind interop / context drops during .map()
const FilterChip = ({ label, isSelected, onPress }) => (
  <Pressable
    onPress={onPress}
    className={`px-4 py-2 rounded-2xl border transition-all active:scale-95 ${
      isSelected
        ? "bg-primary border-primary shadow-xs"
        : "bg-surface-container-lowest border-outline-variant/30"
    }`}
  >
    <Text
      className={`text-xs font-bold ${
        isSelected ? "text-on-primary" : "text-on-surface-variant"
      }`}
    >
      {label}
    </Text>
  </Pressable>
);

export default function Activity() {
  const { user } = useAuth();
  const canView = user?.role === "OWNER" || user?.role === "MANAGER";

  const [typeFilter, setTypeFilter] = useState(null);
  const { data, isLoading, isError, refetch, isRefetching } =
    useInventoryMovements({
      type: typeFilter ?? undefined,
      limit: 50,
    });

  if (!canView) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <View className="w-16 h-16 rounded-3xl bg-red-500/10 items-center justify-center mb-4 border border-red-500/20">
          <ShieldAlert size={30} color="#ba1a1a" />
        </View>
        <Text className="text-on-surface font-bold text-lg text-center mb-1">
          Access Restricted
        </Text>
        <Text className="text-on-surface-variant text-xs text-center leading-relaxed">
          The inventory activity log is reserved for Pharmacy Owners and
          Managers.
        </Text>
      </View>
    );
  }

  const movements = data?.movements ?? [];

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#4f378a" />
        <Text className="text-xs font-medium text-secondary mt-3">
          Fetching Inventory Trail...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <View className="w-14 h-14 rounded-2xl bg-red-500/10 items-center justify-center mb-3">
          <AlertTriangle size={24} color="#ba1a1a" />
        </View>
        <Text className="text-on-surface font-bold text-base text-center">
          Unable to Load Activity
        </Text>
        <Text className="text-on-surface-variant text-xs text-center mt-1 mb-5">
          Please verify your connection and try again.
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="bg-primary px-6 py-2.5 rounded-xl shadow-xs active:opacity-90"
        >
          <Text className="text-on-primary font-bold text-xs">
            Retry Connection
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* HEADER & TOP FILTERS */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="font-bold text-xl text-on-surface">
              Movement Audit Log
            </Text>
            <Text className="text-xs font-medium text-secondary mt-0.5">
              Real-time Inventory Tracking
            </Text>
          </View>
          <View className="bg-surface-container-high px-3 py-1 rounded-full border border-outline-variant/30">
            <Text className="text-[11px] font-bold text-on-surface-variant">
              {movements.length} Events
            </Text>
          </View>
        </View>

        {/* HORIZONTAL TYPE FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 6 }}
        >
          <FilterChip
            label="All Types"
            isSelected={typeFilter === null}
            onPress={() => setTypeFilter(null)}
          />

          {MOVEMENT_TYPES.map((t) => (
            <FilterChip
              key={t}
              label={TYPE_CONFIG[t].label}
              isSelected={typeFilter === t}
              onPress={() => setTypeFilter(t)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ACTIVITY CARDS LIST */}
      <FlatList
        data={movements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <View className="items-center justify-center py-16 px-4">
            <View className="w-16 h-16 rounded-3xl bg-surface-container-high items-center justify-center mb-3">
              <Inbox size={28} color="#7a7582" />
            </View>
            <Text className="font-bold text-on-surface text-base">
              No Activity Recorded
            </Text>
            <Text className="text-xs text-on-surface-variant text-center mt-1 max-w-[220px]">
              No inventory movements match the selected filter criteria.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.ADJUSTMENT;
          const Icon = config.icon;
          const isPositive = item.quantity > 0;

          return (
            <View className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-xs border border-outline-variant/20 flex-row">
              {/* 1. LEFT ACCENT PILLAR */}
              <View
                className={`w-14 items-center justify-start pt-4 ${config.pillarBg} border-r border-outline-variant/15 shrink-0`}
              >
                <View className="w-10 h-10 rounded-2xl bg-surface-container-lowest items-center justify-center shadow-xs">
                  <Icon size={20} color={config.color} />
                </View>
              </View>

              {/* 2. CARD CONTENT AREA */}
              <View className="flex-1 p-4 pl-3.5">
                {/* Header Row: Category Badge + Quantity Pill */}
                <View className="flex-row items-center justify-between gap-2 mb-1.5">
                  <View className="flex-row items-center gap-1.5">
                    <View
                      className={`px-2 py-0.5 rounded-md ${config.badgeBg}`}
                    >
                      <Text
                        className="text-[10px] font-bold tracking-wider uppercase"
                        style={{ color: config.color }}
                      >
                        {config.tag}
                      </Text>
                    </View>
                    <Text className="text-xs font-semibold text-on-surface-variant">
                      {config.label}
                    </Text>
                  </View>

                  {/* Quantity Indicator Pill */}
                  <View
                    className={`px-2.5 py-0.5 rounded-full ${
                      isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
                    }`}
                  >
                    <Text
                      className={`font-bold text-xs ${
                        isPositive ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {isPositive ? `+${item.quantity}` : item.quantity}
                    </Text>
                  </View>
                </View>

                {/* Medicine Title */}
                <Text
                  className="font-bold text-sm text-on-surface leading-snug"
                  numberOfLines={1}
                >
                  {item.batch?.medicine?.name ?? "Unknown Medicine"}
                </Text>

                {/* Batch Number & Meta */}
                <View className="flex-row items-center gap-1 mt-1">
                  <Hash size={12} color="#7a7582" />
                  <Text className="text-xs font-medium text-on-surface-variant">
                    Batch: {item.batch?.batchNumber ?? "—"}
                  </Text>
                </View>

                {/* Note Strip (if present) */}
                {item.note ? (
                  <View className="bg-surface-container-low/70 rounded-xl p-2 mt-2.5 border border-outline-variant/15">
                    <Text className="text-xs text-on-surface-variant italic">
                      "{item.note}"
                    </Text>
                  </View>
                ) : null}

                {/* Footer Timestamp */}
                <View className="flex-row items-center gap-1 mt-3 pt-2 border-t border-outline-variant/10">
                  <Calendar size={11} color="#9aa0a6" />
                  <Text className="text-[10px] font-medium text-outline">
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
