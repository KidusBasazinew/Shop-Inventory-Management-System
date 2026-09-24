import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { Stack } from "expo-router";
import {
  X,
  Receipt,
  User,
  Clock,
  ChevronRight,
  AlertCircle,
} from "lucide-react-native";
import { useSales, useSale } from "../../hooks/useSales";
import { useCreateCustomerPayment } from "../../hooks/usePayments";
import { playSuccess, playError } from "../../lib/feedback";

const STATUS_CONFIG = {
  PAID: {
    label: "Paid",
    color: "#059669",
    pillarBg: "bg-green-500/20",
    badgeBg: "bg-emerald-500/15",
  },
  PARTIAL: {
    label: "Partial",
    color: "#d97706",
    pillarBg: "bg-orange-500/20",
    badgeBg: "bg-amber-500/15",
  },
  UNPAID: {
    label: "Unpaid / Credit",
    color: "#ba1a1a",
    pillarBg: "bg-red-500/20",
    badgeBg: "bg-red-500/15",
  },
};

export default function SalesHistory() {
  const [page, setPage] = useState(1);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const limit = 20;

  const { data, isLoading, isError, refetch, isRefetching } = useSales({
    page,
    limit,
  });
  const sales = data?.items ?? [];
  const totalPages = data?.total ? Math.ceil(data.total / limit) : 1;

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#4f378a" />
        <Text className="text-xs font-medium text-secondary mt-3">
          Loading Ledger...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <View className="w-14 h-14 rounded-2xl bg-red-500/10 items-center justify-center mb-3">
          <AlertCircle size={26} color="#ba1a1a" />
        </View>
        <Text className="text-on-surface font-bold text-base text-center">
          Failed to Load Transactions
        </Text>
        <Text className="text-on-surface-variant text-xs text-center mt-1 mb-5">
          There was an issue fetching the sales history.
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="bg-primary px-6 py-2.5 rounded-xl shadow-xs active:opacity-90"
        >
          <Text className="text-on-primary font-bold text-xs">
            Retry Connection
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Sales Ledger",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-4">
            <View className="w-16 h-16 rounded-3xl bg-surface-container-high items-center justify-center mb-3">
              <Receipt size={28} color="#7a7582" />
            </View>
            <Text className="font-bold text-on-surface text-base">
              No Sales Registered
            </Text>
            <Text className="text-xs text-on-surface-variant text-center mt-1">
              Completed shop transactions will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PAID;

          return (
            <Pressable
              onPress={() => setSelectedSaleId(item.id)}
              className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-xs border border-outline-variant/20 flex-row active:scale-[0.985] transition-all"
            >
              <View
                className={`w-14 items-center justify-center ${config.pillarBg} border-r border-outline-variant/15 shrink-0`}
              >
                <View className="w-10 h-10 rounded-2xl bg-surface-container-lowest items-center justify-center shadow-xs">
                  <Receipt size={20} color={config.color} />
                </View>
              </View>

              <View className="flex-1 p-4 pl-3.5 justify-between">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="font-bold text-sm text-on-surface tracking-tight">
                    #{item.id.slice(-6).toUpperCase()}
                  </Text>
                  <View className={`px-2 py-0.5 rounded-md ${config.badgeBg}`}>
                    <Text
                      className="text-[10px] font-bold tracking-wider uppercase"
                      style={{ color: config.color }}
                    >
                      {config.label}
                    </Text>
                  </View>
                </View>

                <View className="gap-0.5 mb-2">
                  <View className="flex-row items-center gap-1">
                    <User size={12} color="#7a7582" />
                    <Text className="text-xs text-on-surface-variant font-medium">
                      {item.soldBy?.name ?? "Staff Member"}
                      {item.customer?.name ? ` • ${item.customer.name}` : ""}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Clock size={11} color="#9aa0a6" />
                    <Text className="text-[11px] text-outline font-regular">
                      {new Date(item.date).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-2 border-t border-outline-variant/10">
                  <Text className="text-xs font-semibold text-secondary">
                    Total Amount
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Text className="font-extrabold text-base text-on-surface">
                      ETB {Number(item.totalAmount).toLocaleString()}
                    </Text>
                    <ChevronRight size={16} color="#7a7582" />
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      {totalPages > 1 ? (
        <View className="flex-row justify-between items-center px-6 py-3 border-t border-outline-variant/20 bg-surface-container-lowest">
          <Pressable
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={`px-4 py-2 rounded-xl border border-outline-variant/30 ${page <= 1 ? "opacity-40" : "active:bg-surface-container-low"}`}
          >
            <Text className="text-primary font-bold text-xs">Previous</Text>
          </Pressable>
          <Text className="text-on-surface-variant font-semibold text-xs">
            Page {page} of {totalPages}
          </Text>
          <Pressable
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className={`px-4 py-2 rounded-xl border border-outline-variant/30 ${page >= totalPages ? "opacity-40" : "active:bg-surface-container-low"}`}
          >
            <Text className="text-primary font-bold text-xs">Next</Text>
          </Pressable>
        </View>
      ) : null}

      <SaleDetailModal
        saleId={selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
      />
    </View>
  );
}

function SaleDetailModal({ saleId, onClose }) {
  const { data: sale, isLoading } = useSale(saleId);
  const config = STATUS_CONFIG[sale?.status] ?? STATUS_CONFIG.PAID;
  const createPayment = useCreateCustomerPayment();

  const [paying, setPaying] = useState(false);
  const [amount, setAmount] = useState("");

  const balance = sale
    ? Number(sale.totalAmount) - Number(sale.amountPaid ?? 0)
    : 0;

  const handleRecordPayment = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      Alert.alert("Invalid amount", "Enter a positive amount");
      return;
    }
    if (value > balance) {
      Alert.alert(
        "Too much",
        `This sale only has ETB ${balance.toLocaleString()} outstanding`,
      );
      return;
    }
    try {
      await createPayment.mutateAsync({
        customerId: sale.customerId,
        amount: value,
        allocations: [{ targetId: sale.id, amount: value }],
      });
      playSuccess();
      setPaying(false);
      setAmount("");
    } catch (e) {
      playError();
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to record payment",
      );
    }
  };

  return (
    <Modal visible={!!saleId} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[85%] border-t border-outline-variant/20">
          <View className="flex-row justify-between items-center pb-3 border-b border-outline-variant/20">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-2xl bg-primary/10 items-center justify-center">
                <Receipt size={20} color="#4f378a" />
              </View>
              <View>
                <Text className="text-base font-bold text-on-surface">
                  #{sale?.id ? sale.id.slice(-6).toUpperCase() : "Sale Details"}
                </Text>
                <Text className="text-[11px] font-medium text-secondary">
                  Transaction Receipt
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-surface-container-high items-center justify-center"
            >
              <X size={18} color="#434655" />
            </Pressable>
          </View>

          {isLoading || !sale ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator color="#4f378a" />
              <Text className="text-xs text-secondary mt-2">
                Retrieving receipt breakdown...
              </Text>
            </View>
          ) : (
            <>
              <View className="bg-surface-container-low/80 p-3.5 rounded-2xl gap-2 border border-outline-variant/15">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-on-surface-variant font-medium">
                    Sold By:
                  </Text>
                  <Text className="text-xs font-bold text-on-surface">
                    {sale.soldBy?.name ?? "—"}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-on-surface-variant font-medium">
                    Customer:
                  </Text>
                  <Text className="text-xs font-bold text-on-surface">
                    {sale.customer?.name ?? "Walk-in"}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-on-surface-variant font-medium">
                    Date & Time:
                  </Text>
                  <Text className="text-xs font-medium text-on-surface">
                    {new Date(sale.date).toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-on-surface-variant font-medium">
                    Status:
                  </Text>
                  <View className={`px-2 py-0.5 rounded-md ${config.badgeBg}`}>
                    <Text
                      className="text-[10px] font-bold uppercase"
                      style={{ color: config.color }}
                    >
                      {config.label}
                    </Text>
                  </View>
                </View>
                {sale.status !== "PAID" ? (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-on-surface-variant font-medium">
                      Balance Owed:
                    </Text>
                    <Text className="text-xs font-bold text-rose-600">
                      ETB {balance.toLocaleString()}
                    </Text>
                  </View>
                ) : null}
              </View>

              {sale.status !== "PAID" ? (
                paying ? (
                  <View className="gap-2 bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
                    <Text className="text-xs font-bold text-emerald-800">
                      Record a payment
                    </Text>
                    <TextInput
                      placeholder={`Up to ETB ${balance.toLocaleString()}`}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#737686"
                      className="border border-emerald-300 bg-white rounded-xl px-4 py-3 text-on-surface"
                    />
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => {
                          setPaying(false);
                          setAmount("");
                        }}
                        className="flex-1 border border-outline-variant/40 rounded-xl py-2.5 items-center"
                      >
                        <Text className="text-on-surface-variant font-semibold text-xs">
                          Cancel
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={handleRecordPayment}
                        disabled={createPayment.isPending}
                        className="flex-1 bg-teal-600 rounded-xl py-2.5 items-center"
                        style={{ opacity: createPayment.isPending ? 0.6 : 1 }}
                      >
                        <Text className="text-white font-semibold text-xs">
                          {createPayment.isPending
                            ? "Saving..."
                            : "Confirm Payment"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setPaying(true)}
                    className="bg-teal-600 rounded-xl py-3 items-center"
                  >
                    <Text className="text-white font-bold text-xs">
                      Record Payment
                    </Text>
                  </Pressable>
                )
              ) : null}

              <Text className="text-xs font-bold text-on-surface uppercase tracking-wider mt-1">
                Purchased Items ({sale.items?.length ?? 0})
              </Text>

              <View className="gap-2">
                {sale.items?.map((item) => (
                  <View
                    key={item.id}
                    className="flex-row justify-between items-center py-2.5 border-b border-outline-variant/15"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="font-bold text-on-surface text-xs">
                        {item.product?.name ?? "Product"}
                      </Text>
                      <Text className="text-[11px] text-on-surface-variant mt-0.5">
                        {item.quantity} units × ETB{" "}
                        {Number(item.unitPrice).toLocaleString()}
                      </Text>
                    </View>
                    <Text className="font-bold text-sm text-on-surface">
                      ETB {Number(item.subtotal).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="flex-row justify-between items-center pt-3 mt-2 border-t border-dashed border-outline-variant/40">
                <Text className="font-bold text-sm text-on-surface">
                  Grand Total
                </Text>
                <Text className="font-extrabold text-xl text-primary">
                  ETB {Number(sale.totalAmount).toLocaleString()}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
