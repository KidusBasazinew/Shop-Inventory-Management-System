import { View, Text, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";

export default function AlertRow({
  icon: Icon,
  title,
  subtitle,
  trailing,
  tone = "warning",
  onPress,
}) {
  const toneColor = tone === "error" ? "#ba1a1a" : "#b45309";
  const toneBg = tone === "error" ? "bg-error-container" : "bg-amber/10";

  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 py-2.5">
      <View
        className="w-1 h-9 rounded-full"
        style={{ backgroundColor: toneColor, opacity: 0.5 }}
      />
      <View
        className={`w-9 h-9 rounded-xl ${toneBg} items-center justify-center`}
      >
        <Icon size={16} color={toneColor} />
      </View>
      <View className="flex-1 min-w-0">
        <Text
          className="text-[13px] font-medium text-on-surface"
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-[11px] text-on-surface-variant mt-0.5"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <Text className="text-[12px] font-semibold text-on-surface mr-1">
          {trailing}
        </Text>
      ) : null}
      {onPress ? <ChevronRight size={15} color="#c3c6d7" /> : null}
    </Pressable>
  );
}
