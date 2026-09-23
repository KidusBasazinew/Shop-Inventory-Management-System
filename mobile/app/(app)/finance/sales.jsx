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
  ChevronDown,
  Check,
} from "lucide-react-native";
import { router } from "expo-router";
import { useProducts } from "../../../hooks/useProducts";
import { useCustomers } from "../../../hooks/useCustomers";
import { useCreateSale } from "../../../hooks/useSales";

const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "MOBILE_MONEY",
  "CHEQUE",
  "OTHER",
];

export default function Sales() {
  const [cart, setCart] = useState([]); // [{ productId, name, unitType, sellingPrice, quantity, available }]
  const [pickerVisible, setPickerVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [customerPickerVisible, setCustomerPickerVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [saleType, setSaleType] = useState("FULL"); // FULL | CREDIT
  const [customerId, setCustomerId] = useState("");
  const [partialAmount, setPartialAmount] = useState("");
  const [search, setSearch] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);

  const { data, isLoading: searchLoading } = useProducts({ search, limit: 50 });
  const products = data?.items ?? [];
  const { data: customerData } = useCustomers({ limit: 50 });
  const customers = customerData?.items ?? [];
  const selectedCustomer = customers.find((c) => c.id === customerId);

  const createSale = useCreateSale();

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitType: product.unitType,
          sellingPrice: Number(product.sellingPrice),
          quantity: 1,
          available: Number(product.quantity),
        },
      ];
    });
    setPickerVisible(false);
    setSearch("");
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + delta }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const confirmRemoveFromCart = () => {
    if (itemToDelete) {
      setCart((prev) =>
        prev.filter((i) => i.productId !== itemToDelete.productId),
      );
      setItemToDelete(null);
    }
  };

  const grandTotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.sellingPrice,
    0,
  );
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (saleType === "CREDIT" && !customerId) {
      Alert.alert(
        "Customer required",
        "Select a customer for a credit or partial sale",
      );
      return;
    }

    const amountPaid =
      saleType === "FULL" ? undefined : Number(partialAmount) || 0;

    try {
      const sale = await createSale.mutateAsync({
        customerId: customerId || undefined,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        amountPaid,
        paymentMethod,
      });
      setCart([]);
      setCheckoutVisible(false);
      setCustomerId("");
      setPartialAmount("");
      setSaleType("FULL");
      Alert.alert(
        "Sale complete",
        `Total: ETB ${Number(sale.totalAmount).toFixed(2)}`,
      );
    } catch (e) {
      Alert.alert(
        "Checkout failed",
        e?.response?.data?.error ?? "Something went wrong",
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
        <Text className="text-2xl font-bold text-on-background">New Sale</Text>
        <Pressable onPress={() => router.push("/sales-history")} hitSlop={10}>
          <History size={22} color="#004ac6" />
        </Pressable>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.productId}
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
                {item.unitType} • ETB {item.sellingPrice.toFixed(2)} / unit
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => updateQuantity(item.productId, -1)}
                className="w-8 h-8 rounded-full border border-outline-variant/40 items-center justify-center bg-surface-container-low"
              >
                <Minus size={16} color="#434655" />
              </Pressable>

              <Text className="font-bold text-sm w-6 text-center text-on-surface">
                {item.quantity}
              </Text>

              <Pressable
                onPress={() => updateQuantity(item.productId, 1)}
                className="w-8 h-8 rounded-full border border-outline-variant/40 items-center justify-center bg-surface-container-low"
              >
                <Plus size={16} color="#434655" />
              </Pressable>

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

      <Pressable
        onPress={() => setPickerVisible(true)}
        className="absolute bottom-60 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg active:opacity-90"
      >
        <Plus size={26} color="white" />
      </Pressable>

      {cart.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/30 p-4 shadow-xl rounded-t-3xl">
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
                      key={item.productId}
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

            <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-dashed border-outline-variant/30">
              <Text className="text-xs font-extrabold text-on-surface-variant">
                Total Payable:
              </Text>
              <Text className="text-base font-extrabold text-primary">
                ETB {grandTotal.toFixed(2)}
              </Text>
            </View>
          </View>

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

      {/* Product picker */}
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
                placeholder="Search product..."
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
                data={products}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  <Text className="text-center text-on-surface-variant py-6">
                    {search ? "No matches" : "Start typing to search"}
                  </Text>
                }
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => addToCart(item)}
                    disabled={Number(item.quantity) <= 0}
                    className="py-3 border-b border-outline-variant/20 flex-row justify-between items-center"
                    style={{ opacity: Number(item.quantity) <= 0 ? 0.4 : 1 }}
                  >
                    <View className="flex-1 pr-2">
                      <Text className="font-medium text-on-surface">
                        {item.name}
                      </Text>
                      <Text className="text-xs text-on-surface-variant">
                        {item.unitType} • ETB{" "}
                        {Number(item.sellingPrice).toFixed(2)} • {item.quantity}{" "}
                        in stock
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

      {/* Delete confirmation */}
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
                Remove{" "}
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

      {/* Checkout modal */}
      <Modal visible={checkoutVisible} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-surface rounded-3xl p-6 w-full max-w-md gap-4">
            <Text className="text-lg font-bold text-on-surface">
              Confirm Sale
            </Text>

            <View className="bg-surface-container-low p-3.5 rounded-2xl gap-2 max-h-40">
              <ScrollView nestedScrollEnabled>
                <View className="gap-2">
                  {cart.map((item) => (
                    <View
                      key={item.productId}
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

            {/* Sale type: full payment vs credit/partial */}
            <View>
              <Text className="text-xs font-medium text-on-surface-variant mb-2">
                Sale Type
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setSaleType("FULL")}
                  className={`flex-1 px-3 py-2.5 rounded-xl border items-center ${saleType === "FULL" ? "bg-primary border-primary" : "border-outline-variant/40"}`}
                >
                  <Text
                    className={`text-xs font-semibold ${saleType === "FULL" ? "text-white" : "text-on-surface-variant"}`}
                  >
                    Full Payment
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSaleType("CREDIT")}
                  className={`flex-1 px-3 py-2.5 rounded-xl border items-center ${saleType === "CREDIT" ? "bg-primary border-primary" : "border-outline-variant/40"}`}
                >
                  <Text
                    className={`text-xs font-semibold ${saleType === "CREDIT" ? "text-white" : "text-on-surface-variant"}`}
                  >
                    Partial / Credit
                  </Text>
                </Pressable>
              </View>
            </View>

            {saleType === "CREDIT" ? (
              <View className="gap-3">
                <View>
                  <Text className="text-xs font-medium text-on-surface-variant mb-2">
                    Customer (required)
                  </Text>
                  <Pressable
                    onPress={() => setCustomerPickerVisible(true)}
                    className="border border-outline-variant/40 rounded-xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <Text
                      className={`flex-1 ${selectedCustomer ? "text-on-surface" : "text-[#737686]"}`}
                      numberOfLines={1}
                    >
                      {selectedCustomer?.name ?? "Select a customer"}
                    </Text>
                    <ChevronDown size={18} color="#737686" />
                  </Pressable>
                </View>
                <View>
                  <Text className="text-xs font-medium text-on-surface-variant mb-2">
                    Amount paid now (leave 0 for full credit)
                  </Text>
                  <TextInput
                    placeholder="0.00"
                    value={partialAmount}
                    onChangeText={setPartialAmount}
                    keyboardType="decimal-pad"
                    className="border border-outline-variant/40 rounded-xl px-4 py-3 text-on-surface"
                  />
                </View>
              </View>
            ) : (
              <View>
                <Text className="text-xs font-medium text-on-surface-variant mb-2">
                  Payment Method
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => setPaymentMethod(m)}
                      className={`px-3 py-2 rounded-xl border ${paymentMethod === m ? "bg-primary border-primary" : "border-outline-variant/40 bg-surface"}`}
                    >
                      <Text
                        className={`text-xs font-semibold ${paymentMethod === m ? "text-white" : "text-on-surface-variant"}`}
                      >
                        {m.replace("_", " ")}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

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

      {/* Customer picker */}
      <Modal visible={customerPickerVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[75%]">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-on-surface">
                Select Customer
              </Text>
              <Pressable onPress={() => setCustomerPickerVisible(false)}>
                <X size={22} color="#434655" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-2 pb-2">
                {customers.map((customer) => {
                  const isSelected = customer.id === customerId;
                  return (
                    <Pressable
                      key={customer.id}
                      onPress={() => {
                        setCustomerId(customer.id);
                        setCustomerPickerVisible(false);
                      }}
                      className={`p-4 rounded-xl border flex-row items-center justify-between ${isSelected ? "border-primary bg-primary/5" : "border-outline-variant/30 bg-surface-container-low"}`}
                    >
                      <View className="flex-1 pr-3">
                        <Text className="font-semibold text-on-surface">
                          {customer.name}
                        </Text>
                        <Text className="text-xs text-on-surface-variant mt-0.5">
                          {customer.phone}{" "}
                          {customer.balance > 0
                            ? `• Owes ETB ${customer.balance.toLocaleString()}`
                            : ""}
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
    </View>
  );
}
