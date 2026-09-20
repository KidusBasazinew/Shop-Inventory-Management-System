import { View, Text, Pressable } from "react-native";
import {
  Calendar,
  Truck,
  TrendingUp,
  QrCode,
  Sliders,
} from "lucide-react-native";
import Badge from "../common/Badge";

function getExpiryStatus(expiryDate) {
  const days = Math.ceil(
    (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return { label: "EXPIRED", tone: "error", days };
  if (days <= 30)
    return { label: `Expiring: ${days}d left`, tone: "warning", days };
  return {
    label: `Exp: ${new Date(expiryDate).toLocaleDateString()}`,
    tone: "success",
    days,
  };
}

export default function BatchCard({ batch, onAdjust }) {
  const { batchNumber, expiryDate, quantity, buyPrice, sellPrice, supplier } =
    batch;

  const buy = Number(buyPrice);
  const sell = Number(sellPrice);
  const marginPct = buy > 0 ? Math.round(((sell - buy) / buy) * 100) : null;
  const expiry = getExpiryStatus(expiryDate);

  return (
    <View className="bg-surface rounded-2xl border border-outline-variant/40 overflow-hidden shadow-xs">
      {/* Top Tag Header: Lot # Tag & Expiry Status */}
      <View className="flex-row items-center justify-between px-4 py-2.5 bg-surface-variant/40 border-b border-outline-variant/20">
        <View className="flex-row items-center gap-1.5">
          <QrCode size={14} color="#004ac6" />
          <Text className="font-mono font-bold text-xs text-primary uppercase tracking-wider">
            LOT #{batchNumber}
          </Text>
        </View>

        <Badge label={expiry.label} tone={expiry.tone} icon={Calendar} />
      </View>

      <View className="p-4 gap-3">
        {/* Main Section: Big Quantity Counter & Adjust Button */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs uppercase font-semibold text-on-surface-variant/80 tracking-wider">
              Stock Quantity
            </Text>
            <Text className="text-3xl font-extrabold text-on-surface tracking-tight mt-0.5">
              {quantity}{" "}
              <Text className="text-sm font-normal text-on-surface-variant">
                units
              </Text>
            </Text>
          </View>

          <Pressable
            onPress={onAdjust}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 active:bg-primary/20"
          >
            <Sliders size={14} color="#004ac6" />
            <Text className="text-xs font-bold text-primary">Adjust Stock</Text>
          </Pressable>
        </View>

        {/* Pricing Metrics Grid */}
        <View className="flex-row items-center justify-between bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/20">
          <View className="flex-1">
            <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
              Buy Price
            </Text>
            <Text className="text-sm font-semibold text-on-surface mt-0.5">
              ETB {buy.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View className="w-[1px] h-6 bg-outline-variant/30 mx-2" />

          <View className="flex-1">
            <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
              Sell Price
            </Text>
            <Text className="text-sm font-semibold text-on-surface mt-0.5">
              ETB {sell.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {marginPct !== null && (
            <>
              <View className="w-[1px] h-6 bg-outline-variant/30 mx-2" />
              <View className="items-end flex-1">
                <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
                  Margin
                </Text>

                <View className="flex-row items-center gap-1 mt-0.5">
                  <TrendingUp
                    size={12}
                    color={marginPct >= 0 ? "#16a34a" : "#dc2626"}
                  />
                  <Text
                    className={`text-xs font-bold ${
                      marginPct >= 0 ? "text-success" : "text-error"
                    }`}
                  >
                    {marginPct}%
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Supplier Tag (if available) */}
        {supplier ? (
          <View className="flex-row items-center gap-1.5 pt-1">
            <Truck size={13} color="#6d7185" />
            <Text className="text-xs text-on-surface-variant">
              Supplier:{" "}
              <Text className="font-medium text-on-surface">
                {supplier.name}
              </Text>
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
