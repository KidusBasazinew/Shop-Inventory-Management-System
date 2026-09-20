import { View, Text, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";

export default function ChartCard({
  title,
  actionLabel,
  onActionPress,
  children,
  className = "",
}) {
  return (
    <View
      className={`bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/25 ${className}`}
    >
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-[15px] font-bold text-on-surface">{title}</Text>
        {actionLabel ? (
          <Pressable
            onPress={onActionPress}
            className="flex-row items-center gap-0.5"
          >
            <Text className="text-[12px] font-semibold text-primary">
              {actionLabel}
            </Text>
            <ChevronRight size={14} color="#004ac6" />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}
