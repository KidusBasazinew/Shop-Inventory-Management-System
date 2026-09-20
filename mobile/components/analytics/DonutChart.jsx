import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";

export default function DonutChart({
  data,
  totalLabel = "Total",
  totalValue = "100%",
}) {
  let offsetAcc = 0;

  return (
    <View className="items-center">
      <View style={{ width: 168, height: 168 }}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 36 36"
          style={{ transform: [{ rotate: "-90deg" }] }}
        >
          <Circle
            cx="18"
            cy="18"
            r="15.9"
            fill="transparent"
            stroke="#E5EEFF"
            strokeWidth={3.4}
          />
          {data.map((seg) => {
            const dashOffset = -offsetAcc;
            offsetAcc += seg.percent;
            return (
              <Circle
                key={seg.label}
                cx="18"
                cy="18"
                r="15.9"
                fill="transparent"
                stroke={seg.color}
                strokeWidth={3.4}
                strokeDasharray={`${seg.percent} 100`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-[11px] text-outline">{totalLabel}</Text>
          <Text className="text-[20px] font-bold text-on-surface mt-0.5">
            {totalValue}
          </Text>
        </View>
      </View>

      <View className="w-full gap-2.5 mt-5">
        {data.map((seg) => (
          <View
            key={seg.label}
            className="flex-row justify-between items-center"
          >
            <View className="flex-row items-center gap-2">
              <View
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <Text className="text-[13px] text-on-surface-variant capitalize">
                {seg.label.toLowerCase()}
              </Text>
            </View>
            <Text className="text-[13px] font-bold text-on-surface">
              {seg.percent}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
