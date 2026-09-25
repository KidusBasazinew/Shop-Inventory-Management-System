import { useMemo } from "react";
import { View, Text } from "react-native";
import {
  Calendar,
  AlertTriangle,
  Flame,
  ShieldAlert,
  PackageX,
  HelpCircle,
} from "lucide-react-native";
import Badge from "../common/Badge";

const REASON_CONFIG = {
  EXPIRED: {
    label: "Expired",
    tone: "error",
    icon: Flame,
    color: "#BA1A1A",
    bg: "bg-red-500/10",
  },
  RAT_DAMAGE: {
    label: "Pest Damage",
    tone: "error",
    icon: ShieldAlert,
    color: "#BA1A1A",
    bg: "bg-red-500/10",
  },
  BROKEN: {
    label: "Broken",
    tone: "warning",
    icon: PackageX,
    color: "#D97706",
    bg: "bg-amber-500/10",
  },
  SPOILED: {
    label: "Spoiled",
    tone: "warning",
    icon: AlertTriangle,
    color: "#D97706",
    bg: "bg-amber-500/10",
  },
  OTHER: {
    label: "Other",
    tone: "neutral",
    icon: HelpCircle,
    color: "#737686",
    bg: "bg-surface-variant",
  },
};

export default function WasteCard({ record }) {
  const reasonInfo = REASON_CONFIG[record.reason] ?? REASON_CONFIG.OTHER;
  const ReasonIcon = reasonInfo.icon;

  const estimatedLoss = useMemo(() => {
    const qty = Number(record.quantity || 0);
    const unitPrice =
      Number(record.product?.buyPrice) ||
      Number(record.product?.sellingPrice) ||
      0;
    return qty * unitPrice;
  }, [record]);

  return (
    <View className="bg-surface rounded-2xl border border-outline-variant/30 p-4 gap-3 shadow-xs">
      {/* Top Header Row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
          <View
            className={`w-9 h-9 rounded-xl items-center justify-center ${reasonInfo.bg}`}
          >
            <ReasonIcon size={18} color={reasonInfo.color} />
          </View>
          <View className="flex-1">
            <Text
              className="font-bold text-sm text-on-surface"
              numberOfLines={1}
            >
              {record.product?.name ?? "Unknown Product"}
            </Text>
            <Text className="text-[11px] text-on-surface-variant">
              {record.product?.category?.name ?? "General Inventory"}
            </Text>
          </View>
        </View>

        <Badge label={reasonInfo.label} tone={reasonInfo.tone} />
      </View>

      <View className="h-[1px] bg-outline-variant/20 my-0.5" />

      {/* Metric Breakdown Row */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
            Quantity Lost
          </Text>
          <Text className="text-sm font-extrabold text-on-surface mt-0.5">
            {record.quantity}{" "}
            <Text className="text-xs font-normal text-on-surface-variant">
              {record.product?.unitType?.toLowerCase() ?? "units"}
            </Text>
          </Text>
        </View>

        {estimatedLoss > 0 ? (
          <View className="items-end">
            <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
              Est. Value Lost
            </Text>
            <Text className="text-sm font-black text-error mt-0.5">
              ETB{" "}
              {estimatedLoss.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-1">
            <Calendar size={12} color="#737686" />
            <Text className="text-xs font-medium text-on-surface-variant">
              {new Date(record.date).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Footer Date Stamp if Estimated Loss is shown */}
      {estimatedLoss > 0 ? (
        <View className="flex-row items-center justify-between pt-1 border-t border-outline-variant/15">
          <View className="flex-row items-center gap-1">
            <Calendar size={11} color="#9aa0a6" />
            <Text className="text-[11px] text-outline font-medium">
              Logged on {new Date(record.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
