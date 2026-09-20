import React from "react";
import { View, Text } from "react-native";
import { TrendingUp, TrendingDown, Minus } from "lucide-react-native";

const TREND_ICONS = { up: TrendingUp, down: TrendingDown, neutral: Minus };
const TREND_ICON_COLOR = {
  up: "#633b48", // tertiary / positive tint
  down: "#ba1a1a", // error
  neutral: "#7a7582", // outline
};
const TREND_TEXT_CLASS = {
  up: "text-tertiary",
  down: "text-error",
  neutral: "text-on-surface-variant",
};

export default function KPICard({
  label,
  value,
  icon: Icon,
  iconColor = "#4f378a", // Default to primary
  iconBgClassName = "bg-primary-fixed",
  trend = "neutral",
  trendText,
  loading = false,
  variant = "default", // "default" | "hero"
}) {
  const TrendIcon = TREND_ICONS[trend];

  // HERO VARIANT (Full Accent Horizontal Card)
  if (variant === "hero") {
    return (
      <View
        style={{ borderLeftColor: iconColor || "#4f378a" }}
        className="bg-primary border-l-4 rounded-2xl p-4 shadow-sm overflow-hidden flex-row items-center justify-between"
      >
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2 mb-1">
            {Icon ? (
              <View className="w-8 h-8 rounded-lg bg-white/15 items-center justify-center">
                <Icon size={16} color="#ffffff" />
              </View>
            ) : null}
            <Text
              className="text-[11px] font-semibold text-on-primary-container tracking-wider uppercase flex-1"
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>

          <Text
            className="text-on-primary text-[26px] font-bold tracking-tight"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {loading ? "—" : value}
          </Text>

          {trendText ? (
            <View className="flex-row items-center gap-1.5 mt-1.5 self-start bg-white/15 px-2.5 py-0.5 rounded-full">
              {TrendIcon ? <TrendIcon size={11} color="#ffffff" /> : null}
              <Text className="text-[11px] font-medium text-on-primary">
                {trendText}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  // DEFAULT HORIZONTAL ACCENT CARD
  return (
    <View
      style={{ borderLeftColor: iconColor }}
      className="bg-surface-container-lowest border-l-[4px] border-y border-r border-outline-variant/30 rounded-2xl p-3.5 shadow-sm overflow-hidden flex-row items-center justify-between my-1"
    >
      {/* Left Column: Icon + Label */}
      <View className="flex-row items-center gap-3 flex-1 pr-2">
        {Icon ? (
          <View
            className={`w-10 h-10 rounded-xl items-center justify-center shrink-0 ${iconBgClassName}`}
          >
            <Icon size={18} color={iconColor} />
          </View>
        ) : null}

        <View className="flex-1">
          <Text
            className="text-[11px] font-medium text-secondary tracking-wide uppercase"
            numberOfLines={1}
          >
            {label}
          </Text>
          <Text
            className="text-on-surface text-[20px] font-bold mt-0.5"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {loading ? "—" : value}
          </Text>
        </View>
      </View>

      {/* Right Column: Trend & Metrics */}
      {trendText ? (
        <View className="items-end justify-center pl-2 border-l border-outline-variant/20">
          <View className="flex-row items-center gap-1 bg-surface-container-low px-2 py-1 rounded-lg">
            {TrendIcon ? (
              <TrendIcon size={11} color={TREND_ICON_COLOR[trend]} />
            ) : null}
            <Text
              className={`text-[11px] font-semibold ${TREND_TEXT_CLASS[trend]}`}
              numberOfLines={1}
            >
              {trendText}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
