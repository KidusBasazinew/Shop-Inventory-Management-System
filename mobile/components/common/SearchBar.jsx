import { View, TextInput } from "react-native";
import { Search } from "lucide-react-native";

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
}) {
  return (
    <View className="flex-row items-center gap-2 bg-surface-container-low rounded-full px-4 py-3">
      <Search size={18} color="#737686" />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#737686"
        value={value}
        onChangeText={onChangeText}
        className="flex-1 text-[15px] text-on-surface"
      />
    </View>
  );
}
