import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ArrowRight, Sparkles } from "lucide-react-native";

// Rich theme mapping with deep background tints and vibrant icon colors
const SEVERITY_CONFIG = {
  critical: {
    icon: "error-outline",
    color: "#ba1a1a", // app-danger
    pillarBg: "bg-red-500/20",
    badgeBg: "bg-red-500/15 text-red-700",
    tagLabel: "Urgent Action",
  },
  warning: {
    icon: "warning-amber",
    color: "#d97706", // amber-600
    pillarBg: "bg-orange-500/20",
    badgeBg: "bg-amber-500/15 text-amber-800",
    tagLabel: "Attention Required",
  },
  success: {
    icon: "check-circle-outline",
    color: "#059669", // emerald-600
    pillarBg: "bg-green-500/20",
    badgeBg: "bg-emerald-500/15 text-emerald-800",
    tagLabel: "Completed",
  },
  info: {
    icon: "payments",
    color: "#4f378a", // primary
    pillarBg: "bg-purple-500/20",
    badgeBg: "bg-purple-500/15 text-purple-900",
    tagLabel: "Financial",
  },
  neutral: {
    icon: "verified-user",
    color: "#625b71", // secondary
    pillarBg: "bg-slate-500/20",
    badgeBg: "bg-slate-500/15 text-slate-800",
    tagLabel: "System",
  },
};

export default function NotificationCard({
  severity = "info",
  title,
  time,
  description,
  actionLabel,
  onActionPress,
  unread = false,
  onPress,
}) {
  const config = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info;

  return (
    <Pressable
      onPress={onPress}
      className={`relative overflow-hidden rounded-3xl mb-1 flex-row transition-all active:scale-[0.985] ${
        unread
          ? "bg-surface-container-lowest shadow-md shadow-slate-200/50"
          : "bg-surface-container-low/70 opacity-85"
      }`}
    >
      {/* 1. LEFT ACCENT PILLAR WITH INTEGRATED ICON */}
      <View
        className={`w-14 items-center justify-center py-4 ${config.pillarBg} border-r border-outline-variant/15 shrink-0`}
      >
        <View className="w-10 h-10 rounded-2xl bg-surface-container-lowest items-center justify-center shadow-xs">
          <MaterialIcons name={config.icon} size={22} color={config.color} />
        </View>
      </View>

      {/* 2. CARD BODY CONTENT */}
      <View className="flex-1 p-4 pl-3 justify-between">
        {/* Top Header & Meta */}
        <View className="flex-row items-center justify-between mb-1.5">
          {/* Custom Tag Label */}
          <View className="flex-row items-center gap-1.5">
            <View className={`px-2 py-0.5 rounded-md ${config.badgeBg}`}>
              <Text
                className="text-[10px] font-bold tracking-wider uppercase"
                style={{ color: config.color }}
              >
                {config.tagLabel}
              </Text>
            </View>

            {unread && (
              <View className="flex-row items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                <View className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <Text className="text-[10px] font-bold text-primary">NEW</Text>
              </View>
            )}
          </View>

          {/* Time Stamp */}
          <Text className="text-[11px] font-medium text-outline">{time}</Text>
        </View>

        {/* Title */}
        <Text
          className={`font-bold text-sm text-on-surface leading-snug ${
            unread ? "text-on-surface" : "text-on-surface-variant"
          }`}
          numberOfLines={2}
        >
          {title}
        </Text>

        {/* Description Body */}
        <Text className="text-xs text-on-surface-variant/90 mt-1 leading-relaxed font-regular">
          {description}
        </Text>

        {/* 3. TACTILE ACTION BUTTON */}
        {actionLabel ? (
          <View className="mt-3.5 pt-2.5 border-t border-outline-variant/10 flex-row items-center justify-between">
            <Pressable
              onPress={onActionPress}
              className="bg-primary px-4 py-2 rounded-xl flex-row items-center gap-2 shadow-xs active:opacity-90"
            >
              <Text className="text-on-primary font-bold text-xs tracking-wide">
                {actionLabel}
              </Text>
              <ArrowRight size={14} color="#ffffff" />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
