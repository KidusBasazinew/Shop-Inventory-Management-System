import { View, Text, Pressable } from "react-native";
import {
  Package,
  PackageMinus,
  Trash2,
  ChevronRight,
  Ban,
  Layers,
} from "lucide-react-native";
import Badge from "../common/Badge";

export default function ProductCard({ product, onPress, onDeactivate }) {
  const {
    name,
    category,
    unitType,
    minQuantityAlert,
    quantity,
    sellingPrice,
    isActive,
  } = product;
  const isLowStock = Number(quantity) <= Number(minQuantityAlert);

  return (
    <Pressable
      onPress={onPress}
      className={`relative bg-surface rounded-2xl border overflow-hidden transition-all active:scale-[0.99] ${
        isActive
          ? "border-outline-variant/40 shadow-sm"
          : "border-error/20 bg-error/5 opacity-80"
      }`}
    >
      <View
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${isActive ? "bg-primary" : "bg-outline-variant"}`}
      />

      <View className="pl-5 pr-4 py-3.5 gap-2.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-md">
            <Layers size={13} color="#004ac6" />
            <Text className="text-xs font-bold text-primary tracking-wider uppercase">
              {unitType}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {!isActive && <Badge label="Inactive" tone="error" icon={Ban} />}
            {onDeactivate ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onDeactivate();
                }}
                hitSlop={12}
                className="p-1 rounded-full active:bg-error/10"
              >
                <Trash2 size={16} color="#BA1A1A" />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-xl bg-surface-variant/60 border border-outline-variant/30 items-center justify-center flex-shrink-0">
            <Package size={22} color="#004ac6" />
          </View>

          <View className="flex-1 min-w-0">
            <Text
              className="font-bold text-base text-on-surface tracking-tight"
              numberOfLines={1}
            >
              {name}
            </Text>
            {category ? (
              <Text
                className="text-on-surface-variant text-xs font-medium mt-0.5"
                numberOfLines={1}
              >
                {category}
                {product.preferredSupplier?.name
                  ? ` · ${product.preferredSupplier.name}`
                  : ""}
              </Text>
            ) : null}
          </View>

          <ChevronRight size={18} color="#c3c6d7" />
        </View>

        <View className="flex-row items-center justify-between pt-2 border-t border-outline-variant/20 mt-0.5">
          <Text className="text-xs font-semibold text-on-surface">
            ETB {Number(sellingPrice).toFixed(2)}
          </Text>

          <View
            className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: isLowStock ? "#ffdad6" : "#e5eeff" }}
          >
            <PackageMinus
              size={12}
              color={isLowStock ? "#BA1A1A" : "#004ac6"}
            />
            <Text
              className="text-[11px] font-semibold"
              style={{ color: isLowStock ? "#93000a" : "#004ac6" }}
            >
              {quantity} in stock · reorder at {minQuantityAlert}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
