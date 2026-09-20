import { View, Text } from "react-native";

// data: [{ label, primaryPct, secondaryPct }] — percentages 0-100 of bar height
export default function SalesBarChart({
  data,
  peakSalesLabel,
  peakSalesValue,
  peakTxLabel,
  peakTxValue,
}) {
  return (
    <View>
      <View className="h-[200px] flex-row items-end justify-between gap-md px-2">
        {data.map((slot) => (
          <View key={slot.label} className="flex-1 items-center gap-xs">
            <View className="w-full flex-row gap-1 justify-center items-end h-[180px]">
              <View
                className="bg-primary-container flex-1 rounded-t-sm"
                style={{ height: `${slot.primaryPct}%` }}
              />
              <View
                className="bg-secondary-container flex-1 rounded-t-sm"
                style={{ height: `${slot.secondaryPct}%` }}
              />
            </View>
            <Text className="text-label-muted">{slot.label}</Text>
          </View>
        ))}
      </View>

      <View className="mt-lg flex-row gap-xl border-t border-outline-variant pt-md">
        <View>
          <Text className="text-label-muted text-on-surface-variant">
            {peakSalesLabel}
          </Text>
          <Text className="text-headline-md text-primary">
            {peakSalesValue}
          </Text>
        </View>
        <View>
          <Text className="text-label-muted text-on-surface-variant">
            {peakTxLabel}
          </Text>
          <Text className="text-headline-md text-on-secondary-container">
            {peakTxValue}
          </Text>
        </View>
      </View>
    </View>
  );
}
