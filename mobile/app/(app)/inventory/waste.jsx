import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  Plus,
  X,
  Trash2,
  ChevronDown,
  Check,
  Calendar,
} from "lucide-react-native";
import { useWaste, useCreateWaste } from "../../../hooks/useWaste";
import { useProducts } from "../../../hooks/useProducts";
import EmptyState from "../../../components/common/EmptyState";
import FormField from "../../../components/common/FormField";
import Pagination, {
  usePageCount,
} from "../../../components/common/Pagination";
import FAB from "../../../components/common/FAB";
import Badge from "../../../components/common/Badge";
import SheetModal from "../../../components/common/SheetModal";
import { playSuccess, playError } from "../../../lib/feedback";

const REASONS = ["EXPIRED", "RAT_DAMAGE", "BROKEN", "SPOILED", "OTHER"];
const REASON_TONE = {
  EXPIRED: "error",
  RAT_DAMAGE: "error",
  BROKEN: "warning",
  SPOILED: "warning",
  OTHER: "neutral",
};
const PAGE_SIZE = 20;

export default function WasteScreen() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch, isRefetching } = useWaste({
    page,
    limit: PAGE_SIZE,
  });
  const { data: productsData } = useProducts({ limit: 100 });
  const products = productsData?.items ?? [];
  const createWaste = useCreateWaste();

  const [modalVisible, setModalVisible] = useState(false);
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("EXPIRED");

  const records = data?.items ?? [];
  const selectedProduct = products.find((p) => p.id === productId);

  const resetForm = () => {
    setProductId("");
    setQuantity("");
    setReason("EXPIRED");
  };

  const handleSubmit = async () => {
    if (!productId || !quantity || Number(quantity) <= 0) {
      Alert.alert(
        "Missing fields",
        "Select a product and enter a valid quantity",
      );
      return;
    }
    try {
      await createWaste.mutateAsync({
        productId,
        quantity: Number(quantity),
        reason,
      });
      playSuccess();
      resetForm();
      setModalVisible(false);
    } catch (e) {
      playError();
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to record waste",
      );
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#004ac6" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center px-6 bg-background">
        <Text className="text-error text-center mb-4">
          Failed to load waste records
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="bg-primary px-4 py-2 rounded-full"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-3">
        <Text className="text-xl font-bold text-on-surface">
          Waste & Expiry
        </Text>
        <Text className="text-xs text-on-surface-variant mt-0.5">
          Log damaged, expired, or spoiled stock
        </Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingTop: 4,
          gap: 10,
          paddingBottom: 100,
          flexGrow: 1,
        }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon={Trash2}
            title="No waste recorded"
            description="Log a broken, expired, or spoiled item to keep stock accurate."
          />
        }
        renderItem={({ item }) => (
          <View className="bg-surface rounded-2xl border border-outline-variant/30 p-4 gap-2 shadow-xs">
            <View className="flex-row items-center justify-between">
              <Text
                className="font-bold text-sm text-on-surface flex-1 pr-2"
                numberOfLines={1}
              >
                {item.product?.name ?? "Product"}
              </Text>
              <Badge
                label={item.reason.replace("_", " ")}
                tone={REASON_TONE[item.reason] ?? "neutral"}
              />
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-on-surface-variant">
                {item.quantity}{" "}
                {item.product?.unitType?.toLowerCase() ?? "units"} lost
              </Text>
              <View className="flex-row items-center gap-1">
                <Calendar size={11} color="#9aa0a6" />
                <Text className="text-[11px] text-outline">
                  {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      <Pagination
        page={page}
        totalPages={usePageCount(data?.total, PAGE_SIZE)}
        onPageChange={setPage}
      />

      <FAB icon={Plus} onPress={() => setModalVisible(true)} />

      <SheetModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <View className="p-6 gap-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-on-surface">Log Waste</Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <X size={22} color="#434655" />
            </Pressable>
          </View>

          <View>
            <Text className="text-xs font-medium text-on-surface-variant mb-2">
              Product
            </Text>
            <Pressable
              onPress={() => setProductPickerVisible(true)}
              className="border border-outline-variant/40 rounded-xl px-4 py-3 flex-row items-center justify-between"
            >
              <Text
                className={`flex-1 ${selectedProduct ? "text-on-surface" : "text-[#737686]"}`}
                numberOfLines={1}
              >
                {selectedProduct?.name ?? "Select a product"}
              </Text>
              <ChevronDown size={18} color="#737686" />
            </Pressable>
            {selectedProduct ? (
              <Text className="text-[11px] text-on-surface-variant mt-1.5">
                {selectedProduct.quantity} currently in stock
              </Text>
            ) : null}
          </View>

          <FormField
            label="Quantity lost"
            placeholder="e.g. 5"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          <View>
            <Text className="text-xs font-medium text-on-surface-variant mb-2">
              Reason
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {REASONS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setReason(r)}
                  className={`px-3 py-2 rounded-xl border ${reason === r ? "bg-primary border-primary" : "border-outline-variant/40"}`}
                >
                  <Text
                    className={`text-xs font-semibold ${reason === r ? "text-white" : "text-on-surface-variant"}`}
                  >
                    {r.replace("_", " ")}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={createWaste.isPending}
            className="bg-primary rounded-xl py-4 items-center"
            style={{ opacity: createWaste.isPending ? 0.6 : 1 }}
          >
            <Text className="text-white font-semibold">
              {createWaste.isPending ? "Saving..." : "Record Waste"}
            </Text>
          </Pressable>
        </View>
      </SheetModal>

      {/* Product picker */}
      <SheetModal
        visible={productPickerVisible}
        onClose={() => setProductPickerVisible(false)}
      >
        <View className="p-6 gap-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-on-surface">
              Select Product
            </Text>
            <Pressable onPress={() => setProductPickerVisible(false)}>
              <X size={22} color="#434655" />
            </Pressable>
          </View>
          <BottomSheetScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-2 pb-2">
              {products.map((product) => {
                const isSelected = product.id === productId;
                return (
                  <Pressable
                    key={product.id}
                    onPress={() => {
                      setProductId(product.id);
                      setProductPickerVisible(false);
                    }}
                    className={`p-4 rounded-xl border flex-row items-center justify-between ${isSelected ? "border-primary bg-primary/5" : "border-outline-variant/30 bg-surface-container-low"}`}
                  >
                    <View className="flex-1 pr-3">
                      <Text className="font-semibold text-on-surface">
                        {product.name}
                      </Text>
                      <Text className="text-xs text-on-surface-variant mt-0.5">
                        {product.quantity} in stock
                      </Text>
                    </View>
                    {isSelected ? <Check size={18} color="#004ac6" /> : null}
                  </Pressable>
                );
              })}
            </View>
          </BottomSheetScrollView>
        </View>
      </SheetModal>
    </View>
  );
}
