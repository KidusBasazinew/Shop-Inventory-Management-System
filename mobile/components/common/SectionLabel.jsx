import { View, Text, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";

export default function SectionLabel({ label, actionLabel, onActionPress }) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-[12px] font-bold text-on-surface tracking-wide">
        {label}
      </Text>
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
  );
}
