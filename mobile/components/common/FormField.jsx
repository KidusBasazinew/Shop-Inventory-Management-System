import { View, Text, TextInput } from "react-native";

export default function FormField({ label, required, ...inputProps }) {
  return (
    <View>
      {label ? (
        <Text className="text-xs font-medium text-on-surface-variant mb-2">
          {label}
          {required ? <Text className="text-error"> *</Text> : null}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor="#737686"
        className="border border-outline-variant/40 rounded-xl px-4 py-3 text-on-surface"
        {...inputProps}
      />
    </View>
  );
}
