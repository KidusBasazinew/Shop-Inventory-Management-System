import { View, Text, Pressable } from "react-native";

export default function UnitPicker({ units, value, onChange, label = "Unit" }) {
  return (
    <View>
      <Text className="text-xs font-medium text-on-surface-variant mb-2">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {units.map((u) => {
          const active = value === u;
          return (
            <Pressable
              key={u}
              onPress={() => onChange(u)}
              className={`px-3 py-2 rounded-full border ${
                active
                  ? "bg-primary border-primary"
                  : "border-outline-variant/40"
              }`}
            >
              <Text
                className={`text-xs font-medium ${active ? "text-white" : "text-on-surface-variant"}`}
              >
                {u}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
