import { View, Text } from "react-native";

export default function BestSellingRow({
  rank,
  name,
  unitsSold,
  revenue,
  changePct,
}) {
  const isPositive = changePct >= 0;
  return (
    <View className="flex-row items-center gap-md">
      <View className="w-10 h-10 rounded-lg bg-surface-container items-center justify-center">
        <Text className="font-bold text-on-surface-variant">{rank}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-body-md text-on-surface" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-label-muted text-on-surface-variant">
          {unitsSold} units sold
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-body-md font-bold text-on-surface">
          {revenue}
        </Text>
        <Text
          className={`text-label-muted ${isPositive ? "text-emerald" : "text-error"}`}
        >
          {isPositive ? "+" : ""}
          {changePct}%
        </Text>
      </View>
    </View>
  );
}
