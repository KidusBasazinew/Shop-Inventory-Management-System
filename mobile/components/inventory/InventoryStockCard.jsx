import { View, Text, Pressable } from "react-native";
import {
  PillBottle,
  Barcode,
  PackageMinus,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react-native";

export default function InventoryStockCard({ product, onPress }) {
  const {
    name,
    genericName,
    category,
    unitType,
    minQuantityAlert,
    quantity,
    isExpiringSoon,
  } = product;
  const totalQuantity = quantity;
  const reorderLevel = minQuantityAlert;
  const isLowStock = totalQuantity <= reorderLevel;

  const accentColor = isLowStock
    ? "#BA1A1A"
    : isExpiringSoon
      ? "#b45309"
      : "#004ac6";

  return (
    <Pressable
      onPress={onPress}
      className="relative bg-surface rounded-2xl border border-outline-variant/40 overflow-hidden shadow-sm active:scale-[0.99]"
    >
      <View
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: accentColor }}
      />

      <View className="pl-5 pr-4 py-3.5 gap-2.5">
        {/* Top tag row */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-md">
            <Layers size={13} color="#004ac6" />
            <Text className="text-xs font-bold text-primary tracking-wider uppercase">
              {unitType}
            </Text>
          </View>

          {isLowStock ? (
            <View className="flex-row items-center gap-1 bg-error-container px-2 py-0.5 rounded-full">
              <AlertTriangle size={12} color="#BA1A1A" />
              <Text className="text-[10px] font-bold text-on-error-container">
                LOW STOCK
              </Text>
            </View>
          ) : isExpiringSoon ? (
            <View className="flex-row items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
              <Clock size={12} color="#b45309" />
              <Text className="text-[10px] font-bold text-amber-700">
                EXPIRING
              </Text>
            </View>
          ) : null}
        </View>

        {/* Main row */}
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-xl bg-surface-variant/60 border border-outline-variant/30 items-center justify-center flex-shrink-0">
            <PillBottle size={22} color="#004ac6" />
          </View>

          <View className="flex-1 min-w-0">
            <Text
              className="font-bold text-base text-on-surface tracking-tight"
              numberOfLines={1}
            >
              {name}
            </Text>
            {genericName ? (
              <Text
                className="text-on-surface-variant text-xs font-medium mt-0.5"
                numberOfLines={1}
              >
                {genericName}
              </Text>
            ) : null}
          </View>

          <ChevronRight size={18} color="#c3c6d7" />
        </View>

        {/* Bottom bar */}
        <View className="flex-row items-center justify-between pt-2 border-t border-outline-variant/20 mt-0.5">
          {category ? (
            <Text
              className="text-xs font-medium text-on-surface-variant"
              numberOfLines={1}
            >
              {category}
            </Text>
          ) : (
            <Text className="text-xs italic text-on-surface-variant/60">
              Uncategorized
            </Text>
          )}

          <View
            className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: isLowStock ? "#ffdad6" : "#e5eeff" }}
          >
            {isLowStock ? (
              <PackageMinus size={12} color="#BA1A1A" />
            ) : (
              <CheckCircle2 size={12} color="#004ac6" />
            )}
            <Text
              className="text-[11px] font-semibold"
              style={{ color: isLowStock ? "#93000a" : "#004ac6" }}
            >
              {totalQuantity} in stock · reorder at {reorderLevel}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
