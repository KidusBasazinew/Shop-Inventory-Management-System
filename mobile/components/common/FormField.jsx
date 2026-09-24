import { View, Text } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";

export default function FormField({ label, required, ...inputProps }) {
  return (
    <View>
      {label ? (
        <Text className="text-xs font-medium text-on-surface-variant mb-2">
          {label}
          {required ? <Text className="text-error"> *</Text> : null}
        </Text>
      ) : null}
      <BottomSheetTextInput
        placeholderTextColor="#737686"
        className="border border-outline-variant/40 rounded-xl px-4 py-3 text-on-surface"
        {...inputProps}
      />
    </View>
  );
}
