import { View, Text } from "react-native";

// tone: "neutral" | "warning" | "error" | "success"
const TONES = {
  neutral: {
    bg: "bg-surface-container-low",
    text: "text-on-surface-variant",
    iconColor: "#434655",
  },
  warning: { bg: "bg-amber/10", text: "text-amber", iconColor: "#b45309" },
  error: {
    bg: "bg-error-container",
    text: "text-on-error-container",
    iconColor: "#93000a",
  },
  success: { bg: "bg-emerald/10", text: "text-emerald", iconColor: "#10b981" },
};

export default function Badge({ label, tone = "neutral", icon: Icon }) {
  const { bg, text, iconColor } = TONES[tone] ?? TONES.neutral;
  return (
    <View
      className={`flex-row items-center gap-1 ${bg} px-2 py-1 rounded-full`}
    >
      {Icon ? <Icon size={11} color={iconColor} /> : null}
      <Text className={`text-[11px] font-medium ${text}`}>{label}</Text>
    </View>
  );
}
