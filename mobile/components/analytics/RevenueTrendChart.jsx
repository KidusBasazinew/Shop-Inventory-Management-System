import { View, Text } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

// Static demo paths matching the mockup — swap for a scale function once
// real weekly data is wired in.
export default function RevenueTrendChart() {
  return (
    <View>
      <View className="flex-row items-center gap-md mb-md self-end">
        <View className="flex-row items-center gap-xs">
          <View className="w-2.5 h-2.5 rounded-full bg-primary" />
          <Text className="text-label-muted text-on-surface-variant">
            Revenue
          </Text>
        </View>
        <View className="flex-row items-center gap-xs">
          <View className="w-2.5 h-2.5 rounded-full bg-emerald" />
          <Text className="text-label-muted text-on-surface-variant">
            Profit
          </Text>
        </View>
      </View>

      <View className="h-[220px] w-full">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 800 300"
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#004ac6" stopOpacity={1} />
              <Stop offset="100%" stopColor="#004ac6" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path
            d="M0 250 Q 100 200, 200 220 T 400 120 T 600 150 T 800 50"
            fill="none"
            stroke="#004ac6"
            strokeWidth={3}
          />
          <Path
            d="M0 250 Q 100 200, 200 220 T 400 120 T 600 150 T 800 50 V 300 H 0 Z"
            fill="url(#grad1)"
            opacity={0.1}
          />
          <Path
            d="M0 280 Q 100 260, 200 270 T 400 220 T 600 240 T 800 180"
            fill="none"
            stroke="#10b981"
            strokeDasharray="8 4"
            strokeWidth={2.5}
          />
        </Svg>
      </View>

      <View className="flex-row justify-between mt-2 px-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <Text key={d} className="text-label-muted text-outline">
            {d}
          </Text>
        ))}
      </View>
    </View>
  );
}
