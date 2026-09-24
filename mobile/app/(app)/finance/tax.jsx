import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Percent, Receipt, Plus, X } from "lucide-react-native";
import {
  useVatReport,
  useTaxPayments,
  useCreateTaxPayment,
} from "../../../hooks/useTax";
import FormField from "../../../components/common/FormField";
import DateField from "../../../components/common/DateField";
import EmptyState from "../../../components/common/EmptyState";
import FAB from "../../../components/common/FAB";

function monthBounds(monthsAgo = 0) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const to = new Date(
    now.getFullYear(),
    now.getMonth() - monthsAgo + 1,
    0,
    23,
    59,
    59,
  );
  return { from, to };
}

export default function TaxScreen() {
  const { from, to } = useMemo(() => monthBounds(0), []);
  const { data: report, isLoading: reportLoading } = useVatReport({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const { data: paymentsData, isLoading: paymentsLoading } = useTaxPayments({
    limit: 20,
  });
  const createPayment = useCreateTaxPayment();

  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState(
    `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`,
  );
  const [paidDate, setPaidDate] = useState(new Date());
  const [reference, setReference] = useState("");

  const payments = paymentsData?.items ?? [];

  const resetForm = () => {
    setAmount("");
    setReference("");
    setPaidDate(new Date());
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0 || !period) {
      Alert.alert(
        "Missing fields",
        "Enter an amount and period (e.g. 2026-09)",
      );
      return;
    }
    try {
      await createPayment.mutateAsync({
        amount: Number(amount),
        period,
        paidDate: paidDate.toISOString(),
        reference: reference || undefined,
      });
      resetForm();
      setModalVisible(false);
    } catch (e) {
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to record tax payment",
      );
    }
  };

  if (reportLoading || paymentsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#004ac6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-primary rounded-3xl p-6 shadow-md relative overflow-hidden">
          <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <View className="flex-row items-center gap-2.5 mb-3">
            <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center">
              <Percent size={20} color="#ffffff" />
            </View>
            <View>
              <Text className="text-white/70 text-xs font-medium">
                This Month
              </Text>
              <Text className="text-white font-bold text-sm">
                VAT Collected
              </Text>
            </View>
          </View>
          <Text className="text-white font-black text-3xl tracking-tight">
            ETB{" "}
            {Number(report?.vatCollected ?? 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
          <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-white/15">
            <Text className="text-white/80 text-xs">
              {report?.saleCount ?? 0} taxable sales
            </Text>
            <Text className="text-white/80 text-xs">
              Paid: ETB {Number(report?.vatPaid ?? 0).toLocaleString()}
            </Text>
          </View>
        </View>

        <View className="bg-surface-container-low rounded-3xl p-4 border border-outline-variant/20">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-on-surface-variant">
              Outstanding VAT to remit
            </Text>
            <Text
              className={`text-base font-extrabold ${
                Number(report?.vatOutstanding ?? 0) > 0
                  ? "text-rose-600"
                  : "text-emerald-600"
              }`}
            >
              ETB {Number(report?.vatOutstanding ?? 0).toLocaleString()}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-1 px-1">
          <Text className="font-extrabold text-base text-on-surface">
            Tax Payments
          </Text>
        </View>

        {payments.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No tax payments yet"
            description="Record a VAT remittance to the government."
          />
        ) : (
          <View className="gap-2">
            {payments.map((p) => (
              <View
                key={p.id}
                className="bg-surface rounded-2xl border border-outline-variant/30 p-4 flex-row items-center justify-between"
              >
                <View className="flex-1 pr-2">
                  <Text className="font-bold text-sm text-on-surface">
                    {p.period}
                  </Text>
                  <Text className="text-xs text-on-surface-variant mt-0.5">
                    Paid {new Date(p.paidDate).toLocaleDateString()}
                    {p.reference ? ` • Ref: ${p.reference}` : ""}
                  </Text>
                </View>
                <Text className="font-extrabold text-sm text-primary">
                  ETB {Number(p.amount).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <FAB icon={Plus} onPress={() => setModalVisible(true)} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-surface rounded-t-3xl p-6 gap-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-on-surface">
                Record Tax Payment
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={22} color="#434655" />
              </Pressable>
            </View>

            <FormField
              label="Amount"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <FormField
              label="Period"
              placeholder="e.g. 2026-09"
              value={period}
              onChangeText={setPeriod}
            />
            <DateField
              label="Paid date"
              value={paidDate}
              onChange={setPaidDate}
            />
            <FormField
              label="Reference (optional)"
              placeholder="Receipt / transaction ref"
              value={reference}
              onChangeText={setReference}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={createPayment.isPending}
              className="bg-primary rounded-xl py-4 items-center"
              style={{ opacity: createPayment.isPending ? 0.6 : 1 }}
            >
              <Text className="text-white font-semibold">
                {createPayment.isPending ? "Saving..." : "Save Payment"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
