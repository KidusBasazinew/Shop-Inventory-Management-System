import { useState, useMemo } from "react";
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
import {
  ShoppingBag,
  X,
  Plus,
  ChevronDown,
  Check,
  Trash2,
} from "lucide-react-native";
import { usePurchases, useCreatePurchase } from "../../../hooks/usePurchases";
import { useCreateSupplierPayment } from "../../../hooks/usePayments";
import { useProducts } from "../../../hooks/useProducts";
import { useSuppliers } from "../../../hooks/useSuppliers";
import SearchBar from "../../../components/common/SearchBar";
import EmptyState from "../../../components/common/EmptyState";
import FormField from "../../../components/common/FormField";
import PurchaseCard from "../../../components/purchase/PurchaseCard";
import FAB from "../../../components/common/FAB";

const EMPTY_LINE = { productId: "", quantity: "", unitCost: "" };

export default function PurchasesScreen() {
  const [search, setSearch] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [supplierPickerVisible, setSupplierPickerVisible] = useState(false);
  const [productPickerIndex, setProductPickerIndex] = useState(null);

  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState([{ ...EMPTY_LINE }]);

  const [payingPurchase, setPayingPurchase] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const createSupplierPayment = useCreateSupplierPayment();

  const {
    data: purchasesData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = usePurchases({ limit: 50 });
  const { data: productsData } = useProducts({ limit: 100 });
  const { data: supplierData } = useSuppliers({ limit: 50 });
  const createMutation = useCreatePurchase();

  const purchases = purchasesData?.items ?? [];
  const products = productsData?.items ?? [];
  const suppliers = supplierData?.items ?? [];

  const filteredPurchases = useMemo(() => {
    if (!search) return purchases;
    return purchases.filter((p) =>
      p.supplier?.name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [purchases, search]);

  const metrics = useMemo(() => {
    const totalSpend = purchases.reduce(
      (sum, p) => sum + Number(p.totalAmount || 0),
      0,
    );
    const totalUnits = purchases.reduce(
      (sum, p) =>
        sum + (p.items ?? []).reduce((s, i) => s + Number(i.quantity), 0),
      0,
    );
    return { totalSpend, totalUnits };
  }, [purchases]);

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);
  const lineTotal = lines.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0),
    0,
  );

  const resetForm = () => {
    setSupplierId("");
    setLines([{ ...EMPTY_LINE }]);
  };

  const updateLine = (idx, patch) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    );
  };

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (idx) =>
    setLines((prev) => prev.filter((_, i) => i !== idx));

  const handleCreate = async () => {
    if (!supplierId) {
      Alert.alert("Missing supplier", "Select a supplier for this purchase");
      return;
    }
    const validLines = lines.filter(
      (l) => l.productId && l.quantity && l.unitCost,
    );
    if (validLines.length === 0) {
      Alert.alert(
        "Missing items",
        "Add at least one product line with quantity and cost",
      );
      return;
    }

    try {
      await createMutation.mutateAsync({
        supplierId,
        items: validLines.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          unitCost: Number(l.unitCost),
        })),
      });
      resetForm();
      setModalVisible(false);
    } catch (e) {
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to record purchase",
      );
    }
  };

  const handleRecordPayment = async () => {
    const value = Number(payAmount);
    const balance =
      Number(payingPurchase.totalAmount) -
      Number(payingPurchase.amountPaid ?? 0);
    if (!value || value <= 0) {
      Alert.alert("Invalid amount", "Enter a positive amount");
      return;
    }
    if (value > balance) {
      Alert.alert(
        "Too much",
        `This purchase only has ETB ${balance.toLocaleString()} outstanding`,
      );
      return;
    }
    try {
      await createSupplierPayment.mutateAsync({
        supplierId: payingPurchase.supplierId,
        amount: value,
        allocations: [{ targetId: payingPurchase.id, amount: value }],
      });
      setPayingPurchase(null);
      setPayAmount("");
    } catch (e) {
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to record payment",
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
          Failed to load purchases
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
      <View className="bg-surface border-b border-outline-variant/30 px-4 pt-4 pb-3 shadow-xs">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2.5">
            <View className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center">
              <ShoppingBag size={20} color="#004ac6" />
            </View>
            <View>
              <Text className="text-xs uppercase tracking-wider font-bold text-primary">
                Procurement Overview
              </Text>
              <Text className="text-lg font-bold text-on-surface">
                Purchases
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center justify-between bg-surface-container-low p-3 rounded-2xl border border-outline-variant/20 mb-3">
          <View className="flex-1">
            <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
              Total Spend
            </Text>
            <Text className="text-base font-extrabold text-on-surface mt-0.5">
              ETB{" "}
              {metrics.totalSpend.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View className="w-[1px] h-7 bg-outline-variant/30 mx-2" />
          <View className="flex-1">
            <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
              Total Acquired
            </Text>
            <Text className="text-base font-extrabold text-on-surface mt-0.5">
              {metrics.totalUnits}{" "}
              <Text className="text-xs font-normal">units</Text>
            </Text>
          </View>
        </View>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by supplier..."
        />
      </View>

      <FlatList
        data={filteredPurchases}
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
            icon={ShoppingBag}
            title="No Purchases Recorded"
            description="Log your inward stock purchases to track supplier costs and stock levels."
          />
        }
        renderItem={({ item }) => (
          <PurchaseCard
            purchase={item}
            onRecordPayment={() => setPayingPurchase(item)}
          />
        )}
      />

      <FAB icon={Plus} onPress={() => setModalVisible(true)} />

      {/* Create purchase modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/40 justify-end"
        >
          <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[90%]">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-on-surface">
                New Purchase
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={22} color="#434655" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-4 pb-2">
                <View>
                  <Text className="text-xs font-medium text-on-surface-variant mb-2">
                    Supplier
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
                </View>

                <Text className="text-xs font-medium text-on-surface-variant">
                  Items
                </Text>
                {lines.map((line, idx) => {
                  const product = products.find((p) => p.id === line.productId);
                  return (
                    <View
                      key={idx}
                      className="border border-outline-variant/30 rounded-xl p-3 gap-2"
                    >
                      <View className="flex-row items-center justify-between">
                        <Pressable
                          onPress={() => setProductPickerIndex(idx)}
                          className="flex-1 border border-outline-variant/40 rounded-xl px-3 py-2.5 flex-row items-center justify-between mr-2"
                        >
                          <Text
                            className={`flex-1 text-sm ${product ? "text-on-surface" : "text-[#737686]"}`}
                            numberOfLines={1}
                          >
                            {product?.name ?? "Select product"}
                          </Text>
                          <ChevronDown size={16} color="#737686" />
                        </Pressable>
                        {lines.length > 1 ? (
                          <Pressable
                            onPress={() => removeLine(idx)}
                            hitSlop={10}
                          >
                            <Trash2 size={16} color="#BA1A1A" />
                          </Pressable>
                        ) : null}
                      </View>
                      <View className="flex-row gap-2">
                        <View className="flex-1">
                          <FormField
                            placeholder="Quantity"
                            value={line.quantity}
                            onChangeText={(v) =>
                              updateLine(idx, { quantity: v })
                            }
                            keyboardType="numeric"
                          />
                        </View>
                        <View className="flex-1">
                          <FormField
                            placeholder="Unit cost"
                            value={line.unitCost}
                            onChangeText={(v) =>
                              updateLine(idx, { unitCost: v })
                            }
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}

                <Pressable
                  onPress={addLine}
                  className="border border-dashed border-primary/50 rounded-xl py-3 items-center"
                >
                  <Text className="text-primary font-semibold text-sm">
                    + Add another item
                  </Text>
                </Pressable>

                <View className="flex-row items-center justify-between pt-2 border-t border-outline-variant/20">
                  <Text className="text-sm font-semibold text-on-surface-variant">
                    Total
                  </Text>
                  <Text className="text-base font-black text-primary">
                    ETB{" "}
                    {lineTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
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
                {createMutation.isPending ? "Saving..." : "Record Purchase"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Supplier picker */}
      <Modal visible={supplierPickerVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[85%]">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-on-surface">
                Select Supplier
              </Text>
              <Pressable onPress={() => setSupplierPickerVisible(false)}>
                <X size={22} color="#434655" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-2 pb-2">
                {suppliers.map((supplier) => {
                  const isSelected = supplier.id === supplierId;
                  return (
                    <Pressable
                      key={supplier.id}
                      onPress={() => {
                        setSupplierId(supplier.id);
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

      {/* Product picker */}
      <Modal
        visible={productPickerIndex !== null}
        animationType="slide"
        transparent
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[85%]">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-on-surface">
                Select Product
              </Text>
              <Pressable onPress={() => setProductPickerIndex(null)}>
                <X size={22} color="#434655" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-2 pb-2">
                {products.map((product) => (
                  <Pressable
                    key={product.id}
                    onPress={() => {
                      updateLine(productPickerIndex, { productId: product.id });
                      setProductPickerIndex(null);
                    }}
                    className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low flex-row items-center justify-between"
                  >
                    <Text
                      className="font-semibold text-on-surface flex-1"
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>
                    <Text className="text-xs text-on-surface-variant">
                      {product.quantity} in stock
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Record supplier payment */}
      <Modal visible={!!payingPurchase} animationType="fade" transparent>
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="bg-surface rounded-2xl p-6 w-full gap-4">
            <Text className="text-lg font-bold text-on-surface">
              Pay {payingPurchase?.supplier?.name}
            </Text>
            <Text className="text-xs text-on-surface-variant">
              Outstanding: ETB{" "}
              {payingPurchase
                ? (
                    Number(payingPurchase.totalAmount) -
                    Number(payingPurchase.amountPaid ?? 0)
                  ).toLocaleString()
                : 0}
            </Text>
            <FormField
              label="Amount"
              placeholder="0.00"
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="decimal-pad"
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setPayingPurchase(null);
                  setPayAmount("");
                }}
                className="flex-1 border border-outline-variant/40 rounded-xl py-3 items-center"
              >
                <Text className="text-on-surface-variant font-medium">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleRecordPayment}
                disabled={createSupplierPayment.isPending}
                className="flex-1 bg-emerald-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
