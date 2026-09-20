import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Stack } from "expo-router";
import {
  X,
  Receipt,
  User,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  ChevronRight,
  ShoppingBag,
  Clock,
  AlertCircle,
} from "lucide-react-native";
import { useSales, useSale } from "../../hooks/useSales";

// Dedicated Payment Config with matching background and pillar styles
const PAYMENT_CONFIG = {
  CASH: {
    label: "Cash",
    color: "#059669",
    pillarBg: "bg-green-500/20",
    badgeBg: "bg-emerald-500/15",
    icon: Banknote,
  },
  TELEBIRR: {
    label: "Telebirr",
    color: "#004ac6",
    pillarBg: "bg-blue-500/20",
    badgeBg: "bg-blue-500/15",
    icon: Smartphone,
  },
  BANK: {
    label: "Bank Transfer",
    color: "#4f378a",
    pillarBg: "bg-purple-500/20",
    badgeBg: "bg-purple-500/15",
    icon: Building2,
  },
  CBE_BIRR: {
    label: "CBE Birr",
    color: "#d97706",
    pillarBg: "bg-orange-500/20",
    badgeBg: "bg-amber-500/15",
    icon: Smartphone,
  },
  CREDIT: {
    label: "Credit",
    color: "#ba1a1a",
    pillarBg: "bg-red-500/20",
    badgeBg: "bg-red-500/15",
    icon: CreditCard,
  },
};

export default function SalesHistory() {
  const [page, setPage] = useState(1);
  const [selectedSaleId, setSelectedSaleId] = useState(null);

  const { data, isLoading, isError, refetch, isRefetching } = useSales({
    page,
    limit: 20,
  });
  const sales = data?.sales ?? [];

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
              Completed pharmacy transactions will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const paymentConfig =
            PAYMENT_CONFIG[item.paymentMethod] ?? PAYMENT_CONFIG.BANK;
          const PaymentIcon = paymentConfig.icon;

          return (
            <Pressable
              onPress={() => setSelectedSaleId(item.id)}
              className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-xs border border-outline-variant/20 flex-row active:scale-[0.985] transition-all"
            >
              {/* 1. LEFT PAYMENT ACCENT PILLAR */}
              <View
                className={`w-14 items-center justify-center ${paymentConfig.pillarBg} border-r border-outline-variant/15 shrink-0`}
              >
                <View className="w-10 h-10 rounded-2xl bg-surface-container-lowest items-center justify-center shadow-xs">
                  <PaymentIcon size={20} color={paymentConfig.color} />
                </View>
              </View>

              {/* 2. RECEIPT CARD BODY */}
              <View className="flex-1 p-4 pl-3.5 justify-between">
                {/* Top Row: Invoice No. + Payment Tag */}
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="font-bold text-sm text-on-surface tracking-tight">
                    {item.invoiceNumber}
                  </Text>
                  <View
                    className={`px-2 py-0.5 rounded-md ${paymentConfig.badgeBg}`}
                  >
                    <Text
                      className="text-[10px] font-bold tracking-wider uppercase"
                      style={{ color: paymentConfig.color }}
                    >
                      {paymentConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Seller & Date Metadata */}
                <View className="gap-0.5 mb-2">
                  <View className="flex-row items-center gap-1">
                    <User size={12} color="#7a7582" />
                    <Text className="text-xs text-on-surface-variant font-medium">
                      {item.user?.fullName ?? "Staff Member"}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Clock size={11} color="#9aa0a6" />
                    <Text className="text-[11px] text-outline font-regular">
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>

                {/* Bottom Row: Amount + Details Arrow */}
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

      {/* PAGINATION CONTROLS */}
      {data?.totalPages > 1 ? (
        <View className="flex-row justify-between items-center px-6 py-3 border-t border-outline-variant/20 bg-surface-container-lowest">
          <Pressable
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={`px-4 py-2 rounded-xl border border-outline-variant/30 ${
              page <= 1 ? "opacity-40" : "active:bg-surface-container-low"
            }`}
          >
            <Text className="text-primary font-bold text-xs">Previous</Text>
          </Pressable>

          <Text className="text-on-surface-variant font-semibold text-xs">
            Page {data.page} of {data.totalPages}
          </Text>

          <Pressable
            onPress={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className={`px-4 py-2 rounded-xl border border-outline-variant/30 ${
              page >= data.totalPages
                ? "opacity-40"
                : "active:bg-surface-container-low"
            }`}
          >
            <Text className="text-primary font-bold text-xs">Next</Text>
          </Pressable>
        </View>
      ) : null}

      {/* MODAL DETAIL */}
      <SaleDetailModal
        saleId={selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
      />
    </View>
  );
}

function SaleDetailModal({ saleId, onClose }) {
  const { data: sale, isLoading } = useSale(saleId);
  const paymentConfig =
    PAYMENT_CONFIG[sale?.paymentMethod] ?? PAYMENT_CONFIG.BANK;

  return (
    <Modal visible={!!saleId} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[85%] border-t border-outline-variant/20">
          {/* Header Row */}
          <View className="flex-row justify-between items-center pb-3 border-b border-outline-variant/20">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-2xl bg-primary/10 items-center justify-center">
                <Receipt size={20} color="#4f378a" />
              </View>
              <View>
                <Text className="text-base font-bold text-on-surface">
                  {sale?.invoiceNumber ?? "Invoice Details"}
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
              {/* Receipt Summary Grid */}
              <View className="bg-surface-container-low/80 p-3.5 rounded-2xl gap-2 border border-outline-variant/15">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-on-surface-variant font-medium">
                    Issued By:
                  </Text>
                  <Text className="text-xs font-bold text-on-surface">
                    {sale.user?.fullName ?? "—"}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-on-surface-variant font-medium">
                    Date & Time:
                  </Text>
                  <Text className="text-xs font-medium text-on-surface">
                    {new Date(sale.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-on-surface-variant font-medium">
                    Payment Method:
                  </Text>
                  <View
                    className={`px-2 py-0.5 rounded-md ${paymentConfig.badgeBg}`}
                  >
                    <Text
                      className="text-[10px] font-bold uppercase"
                      style={{ color: paymentConfig.color }}
                    >
                      {paymentConfig.label}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Itemized Breakdown List */}
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
                        {item.medicine?.name ?? "Medicine Item"}
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

              {/* Total Calculation Footer */}
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
