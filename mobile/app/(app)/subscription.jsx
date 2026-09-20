import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { CheckCircle2, Clock, XCircle, CreditCard } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import {
  useSubscription,
  usePayments,
  useInitializePayment,
  useVerifyPayment,
} from "../../hooks/usePayments";

const PLANS = [
  { months: 1, label: "1 Month" },
  { months: 3, label: "3 Months" },
  { months: 12, label: "12 Months" },
];

const STATUS_CONFIG = {
  TRIAL: { label: "Trial", color: "#004ac6", icon: Clock },
  ACTIVE: { label: "Active", color: "#0F9D58", icon: CheckCircle2 },
  PAST_DUE: { label: "Past Due", color: "#F9A825", icon: Clock },
  EXPIRED: { label: "Expired", color: "#BA1A1A", icon: XCircle },
  CANCELED: { label: "Canceled", color: "#BA1A1A", icon: XCircle },
};

export default function Subscription() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";

  const {
    data: subscription,
    isLoading: subLoading,
    refetch: refetchSub,
  } = useSubscription();
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const initializeMutation = useInitializePayment();
  const verifyMutation = useVerifyPayment();

  const [selectedPlan, setSelectedPlan] = useState(3);
  const [pendingTxRef, setPendingTxRef] = useState(null);

  const handleSubscribe = async () => {
    try {
      const { checkoutUrl, txRef } =
        await initializeMutation.mutateAsync(selectedPlan);
      setPendingTxRef(txRef);

      const result = await WebBrowser.openBrowserAsync(checkoutUrl);

      // The browser closing doesn't tell us the payment succeeded — Chapa's
      // redirect happens inside that browser session. We always re-check
      // against our own /verify endpoint once control returns to the app,
      // since that's the only source of truth we trust.
      await verifyMutation.mutateAsync(txRef);
      await refetchSub();
    } catch (e) {
      Alert.alert(
        "Payment error",
        e?.response?.data?.message ?? "Something went wrong",
      );
    } finally {
      setPendingTxRef(null);
    }
  };

  const handleCheckStatus = async (txRef) => {
    try {
      const payment = await verifyMutation.mutateAsync(txRef);
      Alert.alert("Payment status", payment.status);
    } catch (e) {
      Alert.alert("Error", "Could not check payment status");
    }
  };

  if (!isOwner) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-on-surface-variant text-center">
          Subscription management is only available to the pharmacy owner
        </Text>
      </View>
    );
  }

  if (subLoading || paymentsLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const statusInfo =
    STATUS_CONFIG[subscription?.subscriptionStatus] ?? STATUS_CONFIG.TRIAL;
  const StatusIcon = statusInfo.icon;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, gap: 20 }}
    >
      {/* Status card */}
      <View className="bg-surface rounded-2xl p-5 border border-outline-variant/30 gap-3">
        <View className="flex-row items-center gap-2">
          <StatusIcon size={22} color={statusInfo.color} />
          <Text
            className="text-lg font-bold"
            style={{ color: statusInfo.color }}
          >
            {statusInfo.label}
          </Text>
        </View>

        {subscription?.subscriptionStatus === "TRIAL" ? (
          <Text className="text-on-surface-variant text-sm">
            {subscription.daysRemainingInTrial} day
            {subscription.daysRemainingInTrial === 1 ? "" : "s"} remaining in
            your trial
          </Text>
        ) : subscription?.subscriptionStatus === "ACTIVE" ? (
          <Text className="text-on-surface-variant text-sm">
            Active — thanks for subscribing to KLABS Pharmacy
          </Text>
        ) : (
          <Text className="text-on-surface-variant text-sm">
            Subscribe below to restore full access
          </Text>
        )}
      </View>

      {/* Plan selector */}
      <View>
        <Text className="text-base font-bold text-on-background mb-3">
          Choose a Plan
        </Text>
        <View className="gap-2">
          {PLANS.map((plan) => (
            <Pressable
              key={plan.months}
              onPress={() => setSelectedPlan(plan.months)}
              className={`p-4 rounded-xl border flex-row justify-between items-center ${
                selectedPlan === plan.months
                  ? "bg-primary/10 border-primary"
                  : "border-outline-variant/30"
              }`}
            >
              <Text
                className={`font-semibold ${
                  selectedPlan === plan.months
                    ? "text-primary"
                    : "text-on-surface"
                }`}
              >
                {plan.label}
              </Text>
              {selectedPlan === plan.months ? (
                <CheckCircle2 size={20} color="#004ac6" />
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        onPress={handleSubscribe}
        disabled={initializeMutation.isPending || verifyMutation.isPending}
        className="bg-primary rounded-xl py-4 items-center flex-row justify-center gap-2"
        style={{
          opacity:
            initializeMutation.isPending || verifyMutation.isPending ? 0.6 : 1,
        }}
      >
        <CreditCard size={18} color="white" />
        <Text className="text-white font-semibold">
          {initializeMutation.isPending
            ? "Starting checkout..."
            : verifyMutation.isPending
              ? "Confirming..."
              : "Pay with Chapa"}
        </Text>
      </Pressable>

      {/* Payment history */}
      <View>
        <Text className="text-base font-bold text-on-background mb-3">
          Payment History
        </Text>
        {(payments ?? []).length === 0 ? (
          <Text className="text-on-surface-variant text-sm">
            No payments yet
          </Text>
        ) : (
          <View className="gap-2">
            {payments.map((p) => (
              <Pressable
                key={p.id}
                onPress={() =>
                  p.status === "PENDING" && handleCheckStatus(p.txRef)
                }
                className="bg-surface p-4 rounded-xl border border-outline-variant/30 flex-row justify-between items-center"
              >
                <View>
                  <Text className="font-medium text-on-surface">
                    {p.planMonths} month{p.planMonths > 1 ? "s" : ""} — ETB{" "}
                    {Number(p.amount).toLocaleString()}
                  </Text>
                  <Text className="text-xs text-on-surface-variant mt-0.5">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <StatusBadge status={p.status} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatusBadge({ status }) {
  const config = {
    PENDING: {
      bg: "bg-surface-container-low",
      text: "text-outline",
      label: "Pending",
    },
    SUCCESS: { bg: "bg-primary/10", text: "text-primary", label: "Success" },
    FAILED: {
      bg: "bg-error-container",
      text: "text-on-error-container",
      label: "Failed",
    },
  }[status] ?? {
    bg: "bg-surface-container-low",
    text: "text-outline",
    label: status,
  };

  return (
    <View className={`px-2 py-1 rounded-full ${config.bg}`}>
      <Text className={`text-[11px] font-bold ${config.text}`}>
        {config.label}
      </Text>
    </View>
  );
}
