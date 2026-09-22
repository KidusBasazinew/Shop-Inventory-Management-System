import { useState } from "react";
/* Temporarily disabled until the inventory hooks are restored.
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import {
  Check,
  ChevronDown,
  PackageOpen,
  Search,
  X,
  Pill,
  Boxes,
  Layers,
} from "lucide-react-native";
import {
  useBatchesForMedicine,
  useCreateBatch,
  useAdjustBatch,
} from "../../hooks/useBatches";
import { useSuppliers } from "../../hooks/useSuppliers";
*/
import FormField from "../../components/common/FormField";
import DateField from "../../components/common/DateField";
import UnitPicker from "../../components/medicines/UnitPicker";
import EmptyState from "../../components/common/EmptyState";
import BatchCard from "../../components/batches/BatchCard";
import FAB from "../../components/common/FAB";

const EMPTY_FORM = {
  batchNumber: "",
  quantity: "",
  buyPrice: "",
  sellPrice: "",
  supplierId: "",
};
const ADJUSTMENT_TYPES = ["ADJUSTMENT", "EXPIRED", "RETURN"];

export default function MedicineBatches() {
  const [expiryDate, setExpiryDate] = useState(null);
  const { medicineId, medicineName } = useLocalSearchParams();
  const { data: supplierData, isLoading: suppliersLoading } = useSuppliers({
    limit: 20,
  });
  const {
    data: batches,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useBatchesForMedicine(medicineId);

  const createMutation = useCreateBatch(medicineId);
  const adjustMutation = useAdjustBatch(medicineId);

  const [modalVisible, setModalVisible] = useState(false);
  const [supplierPickerVisible, setSupplierPickerVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustType, setAdjustType] = useState("ADJUSTMENT");
  const [adjustNote, setAdjustNote] = useState("");
  const suppliers = supplierData?.suppliers ?? [];
  const selectedSupplier = suppliers.find(
    (supplier) => supplier.id === form.supplierId,
  );

  const handleCreate = async () => {
    if (
      !form.batchNumber ||
      !expiryDate ||
      !form.quantity ||
      !form.buyPrice ||
      !form.sellPrice
    ) {
      Alert.alert("Missing fields", "All fields except supplier are required");
      return;
    }
    try {
      await createMutation.mutateAsync({
        batchNumber: form.batchNumber,
        expiryDate: expiryDate.toISOString().split("T")[0],
        quantity: Number(form.quantity),
        buyPrice: Number(form.buyPrice),
        sellPrice: Number(form.sellPrice),
        supplierId: form.supplierId || undefined,
      });
      setForm(EMPTY_FORM);
      setExpiryDate(null);
      setModalVisible(false);
    } catch (e) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? "Failed to create batch",
      );
    }
  };

  const handleAdjust = async () => {
    const delta = Number(adjustDelta);
    if (!delta) {
      Alert.alert("Invalid", "Enter a non-zero adjustment amount");
      return;
    }
    try {
      await adjustMutation.mutateAsync({
        id: adjustTarget.id,
        payload: { delta, type: adjustType, note: adjustNote || undefined },
      });
      setAdjustTarget(null);
      setAdjustDelta("");
      setAdjustType("ADJUSTMENT");
      setAdjustNote("");
    } catch (e) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? "Failed to adjust batch",
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
          Failed to load batches
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

  const batchList = batches ?? [];
  const totalUnits = batchList.reduce((sum, b) => sum + b.quantity, 0);

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{ headerShown: true, title: "Batch Management" }}
      />

      {/* Top Banner: Hero Card for Selected Medicine */}
      <View className="p-4 bg-surface border-b border-outline-variant/30 shadow-xs">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center">
            <Pill size={22} color="#004ac6" />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-xs uppercase tracking-widest font-bold text-primary">
              Active Inventory Item
            </Text>
            <Text
              className="text-lg font-bold text-on-surface"
              numberOfLines={1}
            >
              {medicineName ?? "Medicine Batches"}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-outline-variant/20">
          <View className="flex-row items-center gap-1.5">
            <Boxes size={14} color="#6d7185" />
            <Text className="text-xs text-on-surface-variant font-medium">
              {batchList.length} {batchList.length === 1 ? "Batch" : "Batches"}
            </Text>
          </View>

          <View className="flex-row items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full">
            <Layers size={13} color="#004ac6" />
            <Text className="text-xs font-bold text-primary">
              {totalUnits} Units Total
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={batchList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
          gap: 12,
          flexGrow: 1,
        }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon={PackageOpen}
            title="No batches available"
            description="Add a new lot/batch to track available units and pricing."
          />
        }
        renderItem={({ item }) => (
          <BatchCard batch={item} onAdjust={() => setAdjustTarget(item)} />
        )}
      />

      <FAB onPress={() => setModalVisible(true)} />

      {/* Create batch modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/40 justify-end"
        >
          <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[85%]">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-on-surface">
                New Batch
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={22} color="#434655" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-4 pb-2">
                <FormField
                  label="Batch number"
                  required
                  placeholder="e.g. LOT-2026-001"
                  value={form.batchNumber}
                  onChangeText={(v) =>
                    setForm((p) => ({ ...p, batchNumber: v }))
                  }
                />
                <DateField
                  label="Expiry date"
                  value={expiryDate}
                  onChange={setExpiryDate}
                  minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                />
                <FormField
                  label="Quantity"
                  required
                  placeholder="100"
                  value={form.quantity}
                  onChangeText={(v) => setForm((p) => ({ ...p, quantity: v }))}
                  keyboardType="numeric"
                />
                <FormField
                  label="Buy price"
                  required
                  placeholder="0.00"
                  value={form.buyPrice}
                  onChangeText={(v) => setForm((p) => ({ ...p, buyPrice: v }))}
                  keyboardType="decimal-pad"
                />
                <FormField
                  label="Sell price"
                  required
                  placeholder="0.00"
                  value={form.sellPrice}
                  onChangeText={(v) => setForm((p) => ({ ...p, sellPrice: v }))}
                  keyboardType="decimal-pad"
                />
                <View>
                  <Text className="text-xs font-medium text-on-surface-variant mb-2">
                    Supplier{" "}
                    <Text className="text-on-surface-variant/60">
                      (optional)
                    </Text>
                  </Text>
                  <Pressable
                    onPress={() => setSupplierPickerVisible(true)}
                    className="border border-outline-variant/40 rounded-xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <Text
                      className={`flex-1 ${selectedSupplier ? "text-on-surface" : "text-[#737686]"}`}
                      numberOfLines={1}
                    >
                      {selectedSupplier?.name ?? "Select a supplier"}
                    </Text>
                    <ChevronDown size={18} color="#737686" />
                  </Pressable>
                  {selectedSupplier ? (
                    <Text className="text-[11px] text-on-surface-variant mt-1">
                      {selectedSupplier.phone ??
                        selectedSupplier.address ??
                        selectedSupplier.id}
                    </Text>
                  ) : null}
                </View>
              </View>
            </ScrollView>

            <Pressable
              onPress={handleCreate}
              disabled={createMutation.isPending}
              className="bg-primary rounded-xl py-4 items-center"
              style={{ opacity: createMutation.isPending ? 0.6 : 1 }}
            >
              <Text className="text-white font-semibold">
                {createMutation.isPending ? "Saving..." : "Save Batch"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Supplier Picker Modal */}
      <Modal visible={supplierPickerVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[85%]">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-lg font-bold text-on-surface">
                  Select Supplier
                </Text>
                <Text className="text-xs text-on-surface-variant mt-1">
                  Choose a supplier to attach to this batch.
                </Text>
              </View>
              <Pressable onPress={() => setSupplierPickerVisible(false)}>
                <X size={22} color="#434655" />
              </Pressable>
            </View>

            <View className="flex-row items-center gap-2 border border-outline-variant/40 rounded-xl px-3 py-2">
              <Search size={16} color="#737686" />
              <Text className="text-on-surface-variant text-[15px]">
                {suppliersLoading
                  ? "Loading suppliers..."
                  : `${suppliers.length} suppliers available`}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setForm((p) => ({ ...p, supplierId: "" }));
                setSupplierPickerVisible(false);
              }}
              className="py-3 border-b border-outline-variant/20"
            >
              <Text className="font-medium text-on-surface">No supplier</Text>
              <Text className="text-xs text-on-surface-variant mt-0.5">
                Leave this batch unattached.
              </Text>
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-2 pb-2">
                {suppliers.map((supplier) => {
                  const isSelected = supplier.id === form.supplierId;
                  return (
                    <Pressable
                      key={supplier.id}
                      onPress={() => {
                        setForm((p) => ({ ...p, supplierId: supplier.id }));
                        setSupplierPickerVisible(false);
                      }}
                      className={`p-4 rounded-xl border flex-row items-center justify-between ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-outline-variant/30 bg-surface-container-low"
                      }`}
                    >
                      <View className="flex-1 pr-3">
                        <Text className="font-semibold text-on-surface">
                          {supplier.name}
                        </Text>
                        <Text className="text-xs text-on-surface-variant mt-0.5">
                          {supplier.phone}
                          {supplier.address ? ` • ${supplier.address}` : ""}
                        </Text>
                      </View>
                      {isSelected ? <Check size={18} color="#004ac6" /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Adjust quantity modal */}
      <Modal visible={!!adjustTarget} animationType="fade" transparent>
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="bg-surface rounded-2xl p-6 w-full gap-4">
            <Text className="text-lg font-bold text-on-surface">
              Adjust Batch #{adjustTarget?.batchNumber}
            </Text>
            <Text className="text-xs text-on-surface-variant">
              Current quantity: {adjustTarget?.quantity}
            </Text>

            <FormField
              label="Delta"
              placeholder="e.g. -5 or 10"
              value={adjustDelta}
              onChangeText={setAdjustDelta}
              keyboardType="numbers-and-punctuation"
            />

            <UnitPicker
              units={ADJUSTMENT_TYPES}
              value={adjustType}
              onChange={setAdjustType}
              label="Type"
            />

            <FormField
              label="Note"
              placeholder="optional"
              value={adjustNote}
              onChangeText={setAdjustNote}
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setAdjustTarget(null)}
                className="flex-1 border border-outline-variant/40 rounded-xl py-3 items-center"
              >
                <Text className="text-on-surface-variant font-medium">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleAdjust}
                disabled={adjustMutation.isPending}
                className="flex-1 bg-primary rounded-xl py-3 items-center"
                style={{ opacity: adjustMutation.isPending ? 0.6 : 1 }}
              >
                <Text className="text-white font-semibold">
                  {adjustMutation.isPending ? "Saving..." : "Confirm"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
