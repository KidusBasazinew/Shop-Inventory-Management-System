import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import {
  Plus,
  Minus,
  Trash2,
  Search,
  X,
  ShoppingCart,
  History,
  Receipt,
  AlertTriangle,
} from "lucide-react-native";
import { router } from "expo-router";
import { useMedicines } from "../../../hooks/useMedicines";
import { useCreateSale } from "../../../hooks/useSales";

import BatchPreviewModal from "../../../components/BatchPreviewModal";

const PAYMENT_METHODS = ["CASH", "TELEBIRR", "BANK", "CBE_BIRR", "CREDIT"];

export default function Sales() {
  const [cart, setCart] = useState([]); // [{ medicineId, name, unit, sellingPrice, quantity }]
  const [pickerVisible, setPickerVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [search, setSearch] = useState("");

  // Modal State for Delete Confirmation
  const [itemToDelete, setItemToDelete] = useState(null);

  const [batchPreviewMedicine, setBatchPreviewMedicine] = useState(null);

  const { data, isLoading: searchLoading } = useMedicines({ search });
  const medicines = data?.medicines ?? [];

  const createSale = useCreateSale();

  // Price Extractor Helper
  const getPrice = (med) => Number(med?.sellingPrice ?? med?.price ?? 0);

  const addToCart = (medicine) => {
    const price = getPrice(medicine);
    setCart((prev) => {
      const existing = prev.find((i) => i.medicineId === medicine.id);
      if (existing) {
        return prev.map((i) =>
          i.medicineId === medicine.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          medicineId: medicine.id,
          name: medicine.name,
          unit: medicine.unit,
          sellingPrice: price,
          quantity: 1,
        },
      ];
    });
    setPickerVisible(false);
    setSearch("");
  };

  const updateQuantity = (medicineId, delta) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.medicineId === medicineId
            ? { ...i, quantity: i.quantity + delta }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const confirmRemoveFromCart = () => {
    if (itemToDelete) {
      setCart((prev) =>
        prev.filter((i) => i.medicineId !== itemToDelete.medicineId),
      );
      setItemToDelete(null);
    }
  };

  // Financial Calculations
  const grandTotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.sellingPrice,
    0,
  );
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const sale = await createSale.mutateAsync({
        items: cart.map((i) => ({
          medicineId: i.medicineId,
          quantity: i.quantity,
        })),
        paymentMethod,
      });
      setCart([]);
      setCheckoutVisible(false);
      Alert.alert(
        "Sale complete",
        `Invoice ${sale.invoiceNumber} — ETB ${Number(sale.totalAmount).toFixed(2)}`,
      );
    } catch (e) {
      Alert.alert(
        "Checkout failed",
        e?.response?.data?.message ?? "Something went wrong",
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* HEADER */}
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-on-background">New Sale</Text>
        <Pressable onPress={() => router.push("/sales-history")} hitSlop={10}>
          <History size={22} color="#004ac6" />
        </Pressable>
      </View>

      {/* CART ITEMS LIST */}
      <FlatList
        data={cart}
        keyExtractor={(item) => item.medicineId}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 280 }}
        ListEmptyComponent={
          <View className="items-center mt-16 gap-2">
            <ShoppingCart size={40} color="#c3c6d7" />
            <Text className="text-on-surface-variant">Cart is empty</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-surface p-4 rounded-2xl border border-outline-variant/30 flex-row items-center justify-between shadow-xs">
            <View className="flex-1 pr-2">
              <Text className="font-semibold text-on-surface text-base">
                {item.name}
              </Text>
              <Text className="text-xs text-on-surface-variant">
                {item.unit} • ETB {item.sellingPrice.toFixed(2)} / unit
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => updateQuantity(item.medicineId, -1)}
                className="w-8 h-8 rounded-full border border-outline-variant/40 items-center justify-center bg-surface-container-low"
              >
                <Minus size={16} color="#434655" />
              </Pressable>

              <Text className="font-bold text-sm w-6 text-center text-on-surface">
                {item.quantity}
              </Text>

              <Pressable
                onPress={() => updateQuantity(item.medicineId, 1)}
                className="w-8 h-8 rounded-full border border-outline-variant/40 items-center justify-center bg-surface-container-low"
              >
                <Plus size={16} color="#434655" />
              </Pressable>

              {/* TRASH BUTTON TRIGGERS CONFIRMATION POPUP */}
              <Pressable
                onPress={() => setItemToDelete(item)}
                hitSlop={8}
                className="ml-2 p-1.5 rounded-lg bg-red-500/10"
              >
                <Trash2 size={18} color="#BA1A1A" />
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* FLOATING ADD ITEM BUTTON */}
      <Pressable
        onPress={() => setPickerVisible(true)}
        className="absolute bottom-60 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg active:opacity-90"
      >
        <Plus size={26} color="white" />
      </Pressable>

      {/* E-COMMERCE RECEIPT & CHECKOUT BOTTOM PANEL */}
      {cart.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/30 p-4 shadow-xl rounded-t-3xl">
          {/* E-COMMERCE RECEIPT SUMMARY CARD */}
          <View className="bg-surface p-3.5 rounded-2xl border border-outline-variant/20 mb-3 max-h-44">
            <View className="flex-row items-center gap-2 mb-2 pb-2 border-b border-outline-variant/15">
              <Receipt size={16} color="#004ac6" />
              <Text className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Current Checkout Slip
              </Text>
            </View>

            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              <View className="gap-2">
                {cart.map((item) => {
                  const itemTotal = item.quantity * item.sellingPrice;
                  return (
                    <View
                      key={item.medicineId}
                      className="flex-row justify-between items-center"
                    >
                      <Text
                        className="text-xs font-medium text-on-surface flex-1 pr-2"
                        numberOfLines={1}
                      >
                        {item.quantity > 1 ? `${item.quantity}x ` : "1x "}
                        {item.name}
                      </Text>

                      <Text className="text-xs font-bold text-on-surface">
                        {itemTotal.toFixed(2)} Birr
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* TOTAL COST BAR */}
            <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-dashed border-outline-variant/30">
              <Text className="text-xs font-extrabold text-on-surface-variant">
                Total Payable:
              </Text>
              <Text className="text-base font-extrabold text-primary">
                ETB {grandTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* MAIN CHECKOUT BUTTON */}
          <Pressable
            onPress={() => setCheckoutVisible(true)}
            className="bg-primary rounded-2xl py-4 items-center shadow-sm active:opacity-95 flex-row justify-center gap-2"
          >
            <ShoppingCart size={18} color="#ffffff" />
            <Text className="text-white font-bold text-[15px]">
              Checkout ({totalItemCount}{" "}
              {totalItemCount === 1 ? "item" : "items"})
            </Text>
          </Pressable>
        </View>
      )}

      {/* MEDICINE PICKER MODAL */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[85%]">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-on-surface">
                Add Item
              </Text>
              <Pressable onPress={() => setPickerVisible(false)}>
                <X size={22} color="#434655" />
              </Pressable>
            </View>

            <View className="flex-row items-center gap-2 border border-outline-variant/40 rounded-xl px-3 bg-surface-container-low">
              <Search size={16} color="#737686" />
              <TextInput
                placeholder="Search medicine..."
                value={search}
                onChangeText={setSearch}
                autoFocus
                className="flex-1 py-3 text-[15px] text-on-surface"
              />
            </View>

            {searchLoading ? (
              <ActivityIndicator color="#004ac6" />
            ) : (
              <FlatList
                data={medicines}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <Text className="text-center text-on-surface-variant py-6">
                    {search ? "No matches" : "Start typing to search"}
                  </Text>
                }
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => setBatchPreviewMedicine(item)}
                    className="py-3 border-b border-outline-variant/20 flex-row justify-between items-center"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="font-medium text-on-surface">
                        {item.name}
                      </Text>
                      <Text className="text-xs text-on-surface-variant">
                        {item.unit} • ETB {getPrice(item).toFixed(2)}
                      </Text>
                    </View>
                    <Plus size={18} color="#004ac6" />
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* BATCH PREVIEW MODAL */}
      <BatchPreviewModal
        medicine={batchPreviewMedicine}
        onClose={() => setBatchPreviewMedicine(null)}
        onConfirm={(medicine) => {
          addToCart(medicine);
          setBatchPreviewMedicine(null);
        }}
      />

      {/* DELETE ITEM POPUP MODAL */}
      <Modal visible={!!itemToDelete} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-surface rounded-3xl p-5 w-full max-w-sm gap-4 items-center">
            <View className="w-12 h-12 rounded-full bg-red-500/10 items-center justify-center">
              <AlertTriangle size={24} color="#BA1A1A" />
            </View>

            <View className="items-center">
              <Text className="text-base font-bold text-on-surface text-center">
                Remove Item?
              </Text>
              <Text className="text-xs text-on-surface-variant text-center mt-1">
                Are you sure you want to remove{" "}
                <Text className="font-bold text-on-surface">
                  {itemToDelete?.name}
                </Text>{" "}
                from the cart?
              </Text>
            </View>

            <View className="flex-row gap-3 w-full mt-2">
              <Pressable
                onPress={() => setItemToDelete(null)}
                className="flex-1 border border-outline-variant/40 rounded-xl py-3 items-center"
              >
                <Text className="text-on-surface-variant font-semibold text-xs">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={confirmRemoveFromCart}
                className="flex-1 bg-red-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold text-xs">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CHECKOUT CONFIRMATION MODAL */}
      <Modal visible={checkoutVisible} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-surface rounded-3xl p-6 w-full max-w-md gap-4">
            <Text className="text-lg font-bold text-on-surface">
              Confirm Sale
            </Text>

            {/* ITEM RECAP LIST */}
            <View className="bg-surface-container-low p-3.5 rounded-2xl gap-2 max-h-48">
              <ScrollView nestedScrollEnabled>
                <View className="gap-2">
                  {cart.map((item) => (
                    <View
                      key={item.medicineId}
                      className="flex-row justify-between items-center"
                    >
                      <Text className="text-on-surface text-xs flex-1 font-medium">
                        {item.name} × {item.quantity}
                      </Text>
                      <Text className="text-on-surface font-bold text-xs">
                        {(item.quantity * item.sellingPrice).toFixed(2)} Birr
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <View className="flex-row justify-between items-center pt-2 border-t border-outline-variant/20">
                <Text className="text-xs font-bold text-on-surface-variant">
                  Total:
                </Text>
                <Text className="text-sm font-extrabold text-primary">
                  ETB {grandTotal.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* PAYMENT METHOD SELECTOR */}
            <View>
              <Text className="text-xs font-medium text-on-surface-variant mb-2">
                Payment Method
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setPaymentMethod(m)}
                    className={`px-3 py-2 rounded-xl border ${
                      paymentMethod === m
                        ? "bg-primary border-primary"
                        : "border-outline-variant/40 bg-surface"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        paymentMethod === m
                          ? "text-white"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ACTIONS */}
            <View className="flex-row gap-3 mt-2">
              <Pressable
                onPress={() => setCheckoutVisible(false)}
                className="flex-1 border border-outline-variant/40 rounded-xl py-3.5 items-center"
              >
                <Text className="text-on-surface-variant font-semibold text-xs">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCheckout}
                disabled={createSale.isPending}
                className="flex-1 bg-primary rounded-xl py-3.5 items-center"
                style={{ opacity: createSale.isPending ? 0.6 : 1 }}
              >
                <Text className="text-white font-bold text-xs">
                  {createSale.isPending ? "Processing..." : "Confirm Sale"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
