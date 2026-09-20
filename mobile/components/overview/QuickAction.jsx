import { View, Text, Pressable } from "react-native";

export default function QuickAction({
  icon: Icon,
  label,
  onPress,
  iconColor = "#004ac6",
  iconBgClassName = "bg-primary/10",
}) {
  return (
    <Pressable onPress={onPress} className="items-center gap-2 flex-1">
      <View
        className={`w-12 h-12 rounded-2xl items-center justify-center ${iconBgClassName}`}
      >
        <Icon size={20} color={iconColor} strokeWidth={2.2} />
      </View>
      <Text
        className="text-[11px] font-medium text-on-surface-variant text-center"
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
