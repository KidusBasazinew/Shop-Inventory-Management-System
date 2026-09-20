import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { LineChart } from "react-native-gifted-charts";

export function ChartCard({ title, series }) {
  const [active, setActive] = useState("ALL");

  const renderChart = (s, height = 160) => {
    // 1. Calculate highest point to set explicit dynamic headroom
    const rawMax = Math.max(...s.data.map((d) => d.value), 10);
    // Add 25% padding to the top so curved points don't touch the ceiling
    const computedMaxValue = rawMax * 1.25;

    return (
      <View style={{ overflow: "visible", paddingVertical: 8 }}>
        <LineChart
          data={s.data}
          height={height}
          color={s.color}
          thickness={2.5}
          curved
          areaChart
          // Headroom & Footroom Fixes
          maxValue={computedMaxValue}
          overflowTop={15} // Allows peak curves to extend slightly without clipping
          startFillColor={s.lightColor}
          startOpacity={0.8}
          endFillColor={s.lightColor}
          endOpacity={0.05}
          dataPointsColor={s.color}
          dataPointsRadius={4}
          hideRules
          yAxisTextStyle={{ color: "#79747E", fontSize: 10 }}
          xAxisLabelTextStyle={{ color: "#79747E", fontSize: 10 }}
          xAxisColor="#CBC4D2"
          yAxisColor="transparent"
          noOfSections={3}
          spacing={45}
          initialSpacing={16}
        />
      </View>
    );
  };

  return (
    <View className="bg-surface-container-low rounded-3xl p-4 border border-outline-variant/20 shadow-xs">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-bold text-base text-on-surface">{title}</Text>
      </View>

      {/* Segmented Toggle Bar */}
      <View className="flex-row bg-surface-container-highest rounded-full p-1 mb-4">
        <Pressable
          onPress={() => setActive("ALL")}
          className={`flex-1 py-2 rounded-full items-center ${
            active === "ALL" ? "bg-primary" : ""
          }`}
        >
          <Text
            className={`font-bold text-xs ${
              active === "ALL" ? "text-white" : "text-on-surface-variant"
            }`}
          >
            All
          </Text>
        </Pressable>

        {series.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => setActive(s.key)}
            className={`flex-1 py-2 rounded-full items-center ${
              active === s.key ? "bg-primary" : ""
            }`}
          >
            <Text
              className={`font-bold text-xs ${
                active === s.key ? "text-white" : "text-on-surface-variant"
              }`}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Chart Views */}
      {active === "ALL" ? (
        <View className="gap-6">
          {series.map((s) => {
            const latestValue = s.data[s.data.length - 1]?.value ?? 0;
            return (
              <View key={s.key}>
                <View className="flex-row items-center justify-between mb-2 px-1">
                  <View className="flex-row items-center gap-2">
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: s.color,
                      }}
                    />
                    <Text className="font-semibold text-xs text-on-surface-variant">
                      {s.label}
                    </Text>
                  </View>
                  {s.formatValue && (
                    <Text className="font-bold text-xs text-on-surface">
                      {s.formatValue(latestValue)}
                    </Text>
                  )}
                </View>
                {renderChart(s, 110)}
              </View>
            );
          })}
        </View>
      ) : (
        (() => {
          const s = series.find((x) => x.key === active);
          if (!s) return null;
          const latestValue = s.data[s.data.length - 1]?.value ?? 0;

          return (
            <View>
              {s.formatValue && (
                <Text className="font-extrabold text-2xl text-on-surface mb-2 px-1">
                  {s.formatValue(latestValue)}
                </Text>
              )}
              {renderChart(s, 180)}
            </View>
          );
        })()
      )}
    </View>
  );
}
