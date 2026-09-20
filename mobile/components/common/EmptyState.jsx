import { View, Text } from "react-native";

export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <View className="items-center justify-center py-16 px-8 opacity-70">
      {Icon ? (
        <View className="w-16 h-16 rounded-full bg-surface-container-low items-center justify-center mb-4">
          <Icon size={28} color="#737686" />
        </View>
      ) : null}
      <Text className="text-headline-md text-on-surface text-center">
        {title}
      </Text>
      {description ? (
        <Text className="text-body-sm text-on-surface-variant text-center mt-1">
          {description}
        </Text>
      ) : null}
    </View>
  );
}
