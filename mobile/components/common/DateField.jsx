import { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import { Calendar } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function DateField({
  label,
  value,
  onChange,
  minimumDate,
  placeholder = "Select date",
}) {
  const [show, setShow] = useState(false);

  return (
    <View>
      {label ? (
        <Text className="text-xs font-medium text-on-surface-variant mb-2">
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={() => setShow(true)}
        className="border border-outline-variant/40 rounded-xl px-4 py-3 flex-row items-center gap-2"
      >
        <Calendar size={16} color="#737686" />
        <Text className={value ? "text-on-surface" : "text-outline"}>
          {value ? value.toLocaleDateString() : placeholder}
        </Text>
      </Pressable>

      {show ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          minimumDate={minimumDate}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShow(Platform.OS === "ios");
            if (selectedDate) onChange(selectedDate);
          }}
        />
      ) : null}
    </View>
  );
}
