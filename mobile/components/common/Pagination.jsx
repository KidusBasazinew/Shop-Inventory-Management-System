import { View, Text, Pressable } from "react-native";

const DEFAULT_LIMIT = 20;

export function usePageCount(total, limit = DEFAULT_LIMIT) {
  return total ? Math.max(1, Math.ceil(total / limit)) : 1;
}

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <View className="flex-row justify-between items-center px-6 py-3 border-t border-outline-variant/20 bg-surface-container-lowest">
      <Pressable
        onPress={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className={`px-4 py-2 rounded-xl border border-outline-variant/30 ${
          page <= 1 ? "opacity-40" : "active:bg-surface-container-low"
        }`}
      >
        <Text className="text-primary font-bold text-xs">Previous</Text>
      </Pressable>

      <Text className="text-on-surface-variant font-semibold text-xs">
        Page {page} of {totalPages}
      </Text>

      <Pressable
        onPress={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className={`px-4 py-2 rounded-xl border border-outline-variant/30 ${
          page >= totalPages ? "opacity-40" : "active:bg-surface-container-low"
        }`}
      >
        <Text className="text-primary font-bold text-xs">Next</Text>
      </Pressable>
    </View>
  );
}
