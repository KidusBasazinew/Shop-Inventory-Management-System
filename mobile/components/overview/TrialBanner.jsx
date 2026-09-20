import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Sparkles, ArrowRight } from "lucide-react-native";

export default function TrialBanner({ trialEnd }) {
  if (!trialEnd) return null;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(trialEnd) - new Date()) / (1000 * 60 * 60 * 24)),
  );
  const urgent = daysLeft <= 3;

  return (
    <Pressable
      onPress={() => router.push("/subscription")}
      className={`flex-row items-center gap-3 rounded-2xl px-4 py-3.5 border ${
        urgent
          ? "bg-error-container/40 border-error/20"
          : "bg-amber/10 border-amber/20"
      }`}
    >
      <View
        className={`w-9 h-9 rounded-full items-center justify-center ${urgent ? "bg-error/15" : "bg-amber/15"}`}
      >
        <Sparkles size={16} color={urgent ? "#ba1a1a" : "#b45309"} />
      </View>
      <View className="flex-1">
        <Text
          className={`text-[13px] font-semibold ${urgent ? "text-error" : "text-amber"}`}
        >
          {daysLeft} {daysLeft === 1 ? "day" : "days"} left in your trial
        </Text>
        <Text className="text-[11px] text-on-surface-variant mt-0.5">
          Upgrade to keep full access
        </Text>
      </View>
      <ArrowRight size={16} color={urgent ? "#ba1a1a" : "#b45309"} />
    </Pressable>
  );
}
