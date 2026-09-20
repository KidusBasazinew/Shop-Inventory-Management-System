import { View, Text } from "react-native";
import { COLORS, TYPOGRAPHY, SPACING } from "../../theme/theme";

// Reusable "TODAY ———" style section label used anywhere content needs
// to be grouped (notifications, activity logs, transaction history, etc.)
export default function SectionHeader({ label }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.sm,
        marginBottom: SPACING.cardGap,
      }}
    >
      <Text
        style={{
          ...TYPOGRAPHY.labelCaps,
          color: COLORS.onSurfaceVariant,
          opacity: 0.7,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: COLORS.outlineVariant,
          opacity: 0.3,
        }}
      />
    </View>
  );
}
