import { View, Text, Pressable } from "react-native";
import {
  PillBottle,
  Barcode,
  PackageMinus,
  Trash2,
  ChevronRight,
  Ban,
  Layers,
} from "lucide-react-native";
import Badge from "../common/Badge";

export default function MedicineCard({ medicine, onPress, onDelete }) {
  const { name, genericName, barcode, unit, reorderLevel, isActive } = medicine;

  return (
    <Pressable
      onPress={onPress}
      className={`relative bg-surface rounded-2xl border overflow-hidden transition-all active:scale-[0.99] ${
        isActive
          ? "border-outline-variant/40 shadow-sm"
          : "border-error/20 bg-error/5 opacity-80"
      }`}
    >
      {/* Left Accent Bar: Gives a physical 'shelf tag' / asset label appearance */}
      <View
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          isActive ? "bg-primary" : "bg-outline-variant"
        }`}
      />

      <View className="pl-5 pr-4 py-3.5 gap-2.5">
        {/* Top Header Row: Asset Unit Tag & Status */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-md">
            <Layers size={13} color="#004ac6" />
            <Text className="text-xs font-bold text-primary tracking-wider uppercase">
              {unit}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {!isActive && <Badge label="Inactive" tone="error" icon={Ban} />}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              hitSlop={12}
              className="p-1 rounded-full active:bg-error/10"
            >
              <Trash2 size={16} color="#BA1A1A" />
            </Pressable>
          </View>
        </View>

        {/* Main Content Row: Icon + Name Details */}
        <View className="flex-row items-center gap-3">
          {/* Packaging Box / Vault Icon Container */}
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

        {/* Bottom Inventory Bar: Barcode & Reorder Threshold */}
        <View className="flex-row items-center justify-between pt-2 border-t border-outline-variant/20 mt-0.5">
          {barcode ? (
            <View className="flex-row items-center gap-1.5">
              <Barcode size={14} color="#6d7185" />
              <Text className="text-xs font-mono text-on-surface-variant">
                {barcode}
              </Text>
            </View>
          ) : (
            <Text className="text-xs italic text-on-surface-variant/60">
              No Barcode
            </Text>
          )}

          <View className="flex-row items-center gap-1.5 bg-warning/10 px-2 py-0.5 rounded-full">
            <PackageMinus size={12} color="#855300" />
            <Text className="text-[11px] font-semibold text-warning-dark">
              Min Stock: {reorderLevel}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
