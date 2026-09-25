import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  Plus,
  X,
  Trash2,
  ChevronDown,
  Check,
  PackageX,
  Flame,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
} from "lucide-react-native";
import { useWaste, useCreateWaste } from "../../../hooks/useWaste";
import { useProducts } from "../../../hooks/useProducts";
import SearchBar from "../../../components/common/SearchBar";
import EmptyState from "../../../components/common/EmptyState";
import FormField from "../../../components/common/FormField";
import Pagination, {
  usePageCount,
} from "../../../components/common/Pagination";
import FAB from "../../../components/common/FAB";
import SheetModal from "../../../components/common/SheetModal";
import WasteCard from "../../../components/waste/WasteCard";
import { playSuccess, playError } from "../../../lib/feedback";

const REASONS = [
  { id: "EXPIRED", label: "Expired", icon: Flame },
  { id: "RAT_DAMAGE", label: "Pest Damage", icon: ShieldAlert },
  { id: "BROKEN", label: "Broken", icon: PackageX },
  { id: "SPOILED", label: "Spoiled", icon: AlertTriangle },
  { id: "OTHER", label: "Other", icon: HelpCircle },
];

const PAGE_SIZE = 20;

export default function WasteScreen() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedReasonFilter, setSelectedReasonFilter] = useState("ALL");

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

  // Filtered records based on search and reason pill
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const matchesSearch =
        !search ||
        item.product?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesReason =
        selectedReasonFilter === "ALL" || item.reason === selectedReasonFilter;
      return matchesSearch && matchesReason;
    });
  }, [records, search, selectedReasonFilter]);

  // Overall page metrics
  const metrics = useMemo(() => {
    const totalLostUnits = records.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );
    const totalEstimatedLoss = records.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const unitPrice =
        Number(item.product?.buyPrice) ||
        Number(item.product?.sellingPrice) ||
        0;
      return sum + qty * unitPrice;
    }, 0);
    return { totalLostUnits, totalEstimatedLoss };
  }, [records]);

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
      {/* Header Container */}
      <View className="bg-surface border-b border-outline-variant/30 px-4 pt-4 pb-3 shadow-xs">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2.5">
            <View className="w-10 h-10 rounded-2xl bg-error/10 border border-error/20 items-center justify-center">
              <Trash2 size={20} color="#BA1A1A" />
            </View>
            <View>
              <Text className="text-xs uppercase tracking-wider font-bold text-error">
                Stock Discard Log
              </Text>
              <Text className="text-lg font-bold text-on-surface">
                Waste & Expiry
              </Text>
            </View>
          </View>
        </View>

        {/* Dynamic Metric Bar */}
        <View className="flex-row items-center justify-between bg-surface-container-low p-3 rounded-2xl border border-outline-variant/20 mb-3">
          <View className="flex-1">
            <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
              Total Units Lost
            </Text>
            <Text className="text-base font-extrabold text-on-surface mt-0.5">
              {metrics.totalLostUnits}{" "}
              <Text className="text-xs font-normal">items</Text>
            </Text>
          </View>
          <View className="w-[1px] h-7 bg-outline-variant/30 mx-2" />
          <View className="flex-1">
            <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
              Est. Loss Value
            </Text>
            <Text className="text-base font-extrabold text-error mt-0.5">
              ETB{" "}
              {metrics.totalEstimatedLoss.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search product..."
        />

        {/* Reason Quick Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2.5 -mx-4 px-4"
          contentContainerStyle={{ gap: 6, paddingRight: 16 }}
        >
          <Pressable
            onPress={() => setSelectedReasonFilter("ALL")}
            className={`px-3 py-1.5 rounded-full border ${
              selectedReasonFilter === "ALL"
                ? "bg-primary border-primary"
                : "border-outline-variant/40 bg-surface-container-low"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedReasonFilter === "ALL"
                  ? "text-white"
                  : "text-on-surface-variant"
              }`}
            >
              All Records
            </Text>
          </Pressable>

          {REASONS.map((r) => {
            const isSelected = selectedReasonFilter === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => setSelectedReasonFilter(r.id)}
                className={`px-3 py-1.5 rounded-full border ${
                  isSelected
                    ? "bg-primary border-primary"
                    : "border-outline-variant/40 bg-surface-container-low"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? "text-white" : "text-on-surface-variant"
                  }`}
                >
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List */}
      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          gap: 12,
          paddingBottom: 100,
          flexGrow: 1,
        }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon={Trash2}
            title="No Waste Records Found"
            description="Log damaged, expired, or spoiled items to maintain precise inventory."
          />
        }
        renderItem={({ item }) => <WasteCard record={item} />}
      />

      <Pagination
        page={page}
        totalPages={usePageCount(data?.total, PAGE_SIZE)}
        onPageChange={setPage}
      />

      <FAB icon={Plus} onPress={() => setModalVisible(true)} />

      {/* Record Waste Modal */}
      <SheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        snapPoints={["60%", "88%"]}
        initialIndex={1}
      >
        <View style={{ flexGrow: 1, padding: 24, gap: 16, paddingBottom: 80 }}>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-bold text-on-surface">
                Log Damaged / Expired
              </Text>
              <Text className="text-xs text-on-surface-variant">
                Deduct lost items directly from current stock.
              </Text>
            </View>
            <Pressable onPress={() => setModalVisible(false)}>
              <X size={22} color="#434655" />
            </Pressable>
          </View>

          {/* Product Selector */}
          <View>
            <Text className="text-xs font-medium text-on-surface-variant mb-1.5">
              Product
            </Text>
            <Pressable
              onPress={() => setProductPickerVisible(true)}
              className="border border-outline-variant/40 rounded-xl px-4 py-3 flex-row items-center justify-between bg-surface-container-low"
            >
              <Text
                className={`flex-1 font-medium ${
                  selectedProduct ? "text-on-surface" : "text-[#737686]"
                }`}
                numberOfLines={1}
              >
                {selectedProduct?.name ?? "Select product from stock"}
              </Text>
              <ChevronDown size={18} color="#737686" />
            </Pressable>
            {selectedProduct ? (
              <View className="flex-row items-center justify-between mt-1.5 px-1">
                <Text className="text-[11px] font-medium text-primary">
                  Available: {selectedProduct.quantity}{" "}
                  {selectedProduct.unitType?.toLowerCase() ?? "units"}
                </Text>
                {selectedProduct.buyPrice ? (
                  <Text className="text-[11px] text-on-surface-variant">
                    Cost: ETB{" "}
                    {Number(selectedProduct.buyPrice).toLocaleString()}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* Quantity Input */}
          <FormField
            label="Quantity Lost"
            placeholder="e.g. 5"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />

          {/* Reason Choice Grid */}
          <View>
            <Text className="text-xs font-medium text-on-surface-variant mb-2">
              Reason for Loss
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {REASONS.map((r) => {
                const IconComponent = r.icon;
                const isSelected = reason === r.id;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => setReason(r.id)}
                    className={`flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-xl border ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-outline-variant/40 bg-surface-container-low"
                    }`}
                  >
                    <IconComponent
                      size={15}
                      color={isSelected ? "#FFFFFF" : "#737686"}
                    />
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? "text-white" : "text-on-surface-variant"
                      }`}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Action Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={createWaste.isPending}
            className="bg-error rounded-xl py-4 items-center mt-3 shadow-xs"
            style={{ opacity: createWaste.isPending ? 0.6 : 1 }}
          >
            <Text className="text-white font-bold text-base">
              {createWaste.isPending ? "Logging..." : "Confirm Loss & Deduct"}
            </Text>
          </Pressable>
        </View>
      </SheetModal>

      {/* Product Picker Modal */}
      <SheetModal
        visible={productPickerVisible}
        onClose={() => setProductPickerVisible(false)}
        snapPoints={["50%", "85%"]}
        initialIndex={1}
        scrollable={false}
      >
        <View style={{ flex: 1, padding: 24, gap: 16, paddingBottom: 80 }}>
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-on-surface">
              Select Waste Item
            </Text>
            <Pressable onPress={() => setProductPickerVisible(false)}>
              <X size={22} color="#434655" />
            </Pressable>
          </View>
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
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
                    className={`p-4 rounded-xl border flex-row items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant/30 bg-surface-container-low"
                    }`}
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
