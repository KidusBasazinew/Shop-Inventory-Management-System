import { View, Text } from "react-native";
import {
  Pill,
  QrCode,
  Truck,
  TrendingUp,
  DollarSign,
  Calendar,
  Layers,
} from "lucide-react-native";
import Badge from "../common/Badge";

function getExpiryStatus(expiryDate) {
  const days = Math.ceil(
    (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return { label: "EXPIRED", tone: "error" };
  if (days <= 30) return { label: `${days}d left`, tone: "warning" };
  return {
    label: new Date(expiryDate).toLocaleDateString(),
    tone: "success",
  };
}

export default function PurchaseCard({ purchase }) {
  const {
    batchNumber,
    medicineName,
    expiryDate,
    quantity,
    buyPrice,
    sellPrice,
    supplier,
  } = purchase;

  const buy = Number(buyPrice || 0);
  const sell = Number(sellPrice || 0);
  const totalInvestment = buy * Number(quantity || 0);
  const profitPerUnit = sell - buy;
  const marginPct = buy > 0 ? Math.round((profitPerUnit / buy) * 100) : 0;
  const expiry = getExpiryStatus(expiryDate);

  return (
    <View className="bg-surface rounded-2xl border border-outline-variant/40 overflow-hidden shadow-xs">
      {/* Header Tag Bar */}
      <View className="flex-row items-center justify-between px-4 py-2.5 bg-surface-variant/30 border-b border-outline-variant/20">
        <View className="flex-row items-center gap-1.5">
          <QrCode size={14} color="#004ac6" />
          <Text className="font-mono font-bold text-xs text-primary uppercase tracking-wider">
            LOT #{batchNumber}
          </Text>
        </View>

        <Badge label={expiry.label} tone={expiry.tone} icon={Calendar} />
      </View>

      <View className="p-4 gap-3">
        {/* Title & Units */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text
              className="text-base font-bold text-on-surface"
              numberOfLines={1}
            >
              {medicineName ?? "Unassigned Medicine"}
            </Text>
            {supplier ? (
              <View className="flex-row items-center gap-1 mt-1">
                <Truck size={12} color="#6d7185" />
                <Text
                  className="text-xs font-medium text-on-surface-variant"
                  numberOfLines={1}
                >
                  Vendor: {supplier.name}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="bg-primary/10 px-2.5 py-1 rounded-full flex-row items-center gap-1">
            <Layers size={12} color="#004ac6" />
            <Text className="text-xs font-bold text-primary">
              {quantity} units
            </Text>
          </View>
        </View>

        {/* Financial Metrics Box */}
        <View className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 gap-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
                Unit Buy Price
              </Text>
              <Text className="text-sm font-bold text-on-surface mt-0.5">
                ETB {buy.toFixed(2)}
              </Text>
            </View>

            <View className="w-[1px] h-6 bg-outline-variant/30 mx-2" />

            <View className="flex-1">
              <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
                Unit Sell Price
              </Text>
              <Text className="text-sm font-bold text-on-surface mt-0.5">
                ETB {sell.toFixed(2)}
              </Text>
            </View>

            <View className="w-[1px] h-6 bg-outline-variant/30 mx-2" />

            <View className="flex-1 items-end">
              <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
                Profit Margin
              </Text>
              <View className="flex-row items-center gap-1 mt-0.5">
                <TrendingUp
                  size={12}
                  color={marginPct >= 0 ? "#16a34a" : "#dc2626"}
                />
                <Text
                  className={`text-xs font-extrabold ${
                    marginPct >= 0 ? "text-success" : "text-error"
                  }`}
                >
                  +{marginPct}%
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Total Batch Investment Line */}
          <View className="pt-2 border-t border-outline-variant/20 flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-on-surface-variant">
              Total Purchase Outlay:
            </Text>
            <Text className="text-sm font-black text-primary">
              ETB{" "}
              {totalInvestment.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
