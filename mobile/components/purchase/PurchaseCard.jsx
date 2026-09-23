import { View, Text } from "react-native";
import { Truck, Layers, Calendar } from "lucide-react-native";
import Badge from "../common/Badge";

const STATUS_TONE = { UNPAID: "error", PARTIAL: "warning", PAID: "success" };

export default function PurchaseCard({ purchase }) {
  const { supplier, date, totalAmount, status, items = [] } = purchase;
  const totalUnits = items.reduce((sum, i) => sum + Number(i.quantity), 0);

  return (
    <View className="bg-surface rounded-2xl border border-outline-variant/40 overflow-hidden shadow-xs">
      <View className="flex-row items-center justify-between px-4 py-2.5 bg-surface-variant/30 border-b border-outline-variant/20">
        <View className="flex-row items-center gap-1.5">
          <Truck size={14} color="#004ac6" />
          <Text
            className="font-bold text-xs text-primary uppercase tracking-wider"
            numberOfLines={1}
          >
            {supplier?.name ?? "Unknown supplier"}
          </Text>
        </View>
        <Badge
          label={status}
          tone={STATUS_TONE[status] ?? "neutral"}
          icon={Calendar}
        />
      </View>

      <View className="p-4 gap-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-xs text-on-surface-variant">
              {new Date(date).toLocaleDateString()}
            </Text>
            <Text className="text-xs text-on-surface-variant mt-0.5">
              {items.length} {items.length === 1 ? "item" : "items"}
            </Text>
          </View>

          <View className="bg-primary/10 px-2.5 py-1 rounded-full flex-row items-center gap-1">
            <Layers size={12} color="#004ac6" />
            <Text className="text-xs font-bold text-primary">
              {totalUnits} units
            </Text>
          </View>
        </View>

        <View className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 gap-1.5">
          {items.map((i) => (
            <View key={i.id} className="flex-row items-center justify-between">
              <Text
                className="text-xs text-on-surface-variant flex-1"
                numberOfLines={1}
              >
                {i.product?.name ?? "Product"} × {i.quantity}
              </Text>
              <Text className="text-xs font-semibold text-on-surface">
                ETB {Number(i.subtotal).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View className="pt-2 border-t border-outline-variant/20 flex-row items-center justify-between">
          <Text className="text-xs font-semibold text-on-surface-variant">
            Total Purchase Outlay:
          </Text>
          <Text className="text-sm font-black text-primary">
            ETB{" "}
            {Number(totalAmount).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>
    </View>
  );
}
