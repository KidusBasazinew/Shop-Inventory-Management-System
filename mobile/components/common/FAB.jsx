import { Pressable } from "react-native";
import { Plus } from "lucide-react-native";
import { COLORS } from "../../theme/theme";

export default function FAB({
  icon: Icon = Plus,
  onPress,
  size = 56,
  bottom = 24,
  right = 24,
}) {
  const IconComponent = typeof Icon === "function" ? Icon : Plus;

  return (
    <Pressable
      onPress={onPress}
      className="absolute items-center justify-center rounded-full shadow-lg bg-primary"
      style={{
        position: "absolute",
        bottom,
        right,
        width: size,
        height: size,
        borderRadius: size / 2,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
        zIndex: 999,
      }}
    >
      <IconComponent size={26} color="#ffffff" strokeWidth={2.75} />
    </Pressable>
  );
}
