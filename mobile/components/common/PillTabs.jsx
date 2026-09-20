import { ScrollView, Pressable, Text } from "react-native";

// options: [{ label, value }]
export default function PillTabs({ options, value, onChange }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="gap-sm"
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-full border ${i > 0 ? "ml-sm" : ""} ${
              active
                ? "bg-primary border-primary"
                : "bg-surface border-outline-variant"
            }`}
          >
            <Text
              className={`text-label-caps ${active ? "text-on-primary" : "text-on-surface-variant"}`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
