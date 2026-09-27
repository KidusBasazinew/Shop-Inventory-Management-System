import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Upload,
  Bell,
  CalendarDays,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import {
  useSubscription,
  useMySubscriptionPayments,
  useSubmitPayment,
} from "../../hooks/useSubscription";
import { useNotifications, useMarkNotificationsRead } from "../../hooks/useNotifications";

const PLANS = [
  { months: 1, label: "1 Month", hint: "30 days" },
  { months: 3, label: "3 Months", hint: "90 days" },
  { months: 12, label: "12 Months", hint: "360 days" },
];

const STATUS_CONFIG = {
  TRIAL: { label: "Trial", color: "#004ac6", icon: Clock },
  ACTIVE: { label: "Active", color: "#0F9D58", icon: CheckCircle2 },
  PAST_DUE: { label: "Past Due", color: "#F9A825", icon: Clock },
  EXPIRED: { label: "Expired", color: "#BA1A1A", icon: XCircle },
  CANCELED: { label: "Canceled", color: "#BA1A1A", icon: XCircle },
};

const PAYMENT_STATUS = {
  PENDING: { label: "Under review", color: "#F9A825" },
  AI_VERIFIED: { label: "Verified (auto)", color: "#0F9D58" },
  MANUAL_VERIFIED: { label: "Verified", color: "#0F9D58" },
  REJECTED: { label: "Rejected", color: "#BA1A1A" },
};

export default function Subscription() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";

  const {
    data: subscription,
    isLoading: subLoading,
    refetch: refetchSub,
  } = useSubscription();
  const { data: payments, isLoading: paymentsLoading } =
    useMySubscriptionPayments();
  const submitMutation = useSubmitPayment();
  const { data: notifications } = useNotifications(20);
  const markRead = useMarkNotificationsRead();

  const [selectedPlan, setSelectedPlan] = useState(1);
  const [screenshot, setScreenshot] = useState(null);
  const [payerName, setPayerName] = useState("");
  const [bankReference, setBankReference] = useState("");

  const pickScreenshot = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo access so we can attach your payment screenshot.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets?.length) {
      setScreenshot(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow camera access to photograph your receipt.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets?.length) {
      setScreenshot(result.assets[0]);
    }
  };

  const handleSubmit = () => {
    if (!screenshot) {
      Alert.alert("Screenshot required", "Attach a screenshot or photo of your payment proof.");
      return;
    }
    Alert.alert(
      "Submit payment proof?",
      `Plan: ${selectedPlan} month${selectedPlan > 1 ? "s" : ""}\nWe will verify it and activate your subscription.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            try {
              await submitMutation.mutateAsync({
                payload: {
                  planMonths: selectedPlan,
                  payerName: payerName.trim() || undefined,
                  payerPhone: user?.phone ?? undefined,
                  bankReference: bankReference.trim() || undefined,
                },
                image: {
                  uri: screenshot.uri,
                  name: screenshot.fileName ?? "payment-screenshot.jpg",
                  mimeType: screenshot.mimeType ?? "image/jpeg",
                },
              });
              setScreenshot(null);
              setBankReference("");
              Alert.alert(
                "Submitted ✓",
                "Your payment proof is under review. You will get a notification once it is verified (usually within minutes).",
              );
              refetchSub();
            } catch (e) {
              Alert.alert(
                "Upload failed",
                e?.response?.data?.error ?? e?.message ?? "Something went wrong",
              );
            }
          },
        },
      ],
    );
  };

  if (!isOwner) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-on-surface-variant text-center">
          Subscription management is only available to the shop owner
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
  const days = subscription?.daysRemaining;
  const urgent =
    subscription?.subscriptionStatus === "ACTIVE" && days != null && days <= 3;

  const unread = (notifications ?? []).filter((n) => !n.isRead);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, gap: 20 }}
    >
      {/* Platform messages / reminders */}
      {unread.length > 0 ? (
        <View className="gap-2">
          {unread.map((n) => (
            <Pressable
              key={n.id}
              className={`p-4 rounded-2xl border ${
                n.severity === "critical"
                  ? "bg-error-container border-error/30"
                  : n.severity === "warning"
                    ? "bg-surface-container-high border-outline-variant/40"
                    : "bg-surface border-outline-variant/30"
              }`}
              onPress={() => markRead.mutate([n.id])}
            >
              <View className="flex-row items-center gap-2">
                <Bell size={16} color={n.severity === "critical" ? "#BA1A1A" : "#F9A825"} />
                <Text className="font-bold text-on-surface flex-1">{n.title}</Text>
              </View>
              <Text className="text-on-surface-variant text-sm mt-1">{n.body}</Text>
              <Text className="text-[10px] text-outline mt-2">
                Tap to dismiss · {new Date(n.createdAt).toLocaleString()}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Status card */}
      <View className="bg-surface rounded-2xl p-5 border border-outline-variant/30 gap-3">
        <View className="flex-row items-center gap-2">
          <StatusIcon size={22} color={statusInfo.color} />
          <Text className="text-lg font-bold" style={{ color: statusInfo.color }}>
            {statusInfo.label}
          </Text>
        </View>

        {subscription?.daysRemaining != null ? (
          <View className="flex-row items-center gap-2">
            <CalendarDays size={16} color="#737686" />
            <Text className="text-on-surface-variant text-sm">
              {days} day{days === 1 ? "" : "s"} remaining
              {subscription?.subscriptionStatus === "TRIAL" ? " in your trial" : ""}
            </Text>
          </View>
        ) : null}

        {urgent ? (
          <View className="bg-error-container rounded-xl p-3">
            <Text className="text-on-error-container text-sm font-semibold">
              Your subscription ends in {days} day{days === 1 ? "" : "s"}! Send
              your payment and upload the screenshot below to keep access.
            </Text>
          </View>
        ) : null}

        {subscription?.pendingRequest ? (
          <View className="bg-surface-container-low rounded-xl p-3">
            <Text className="text-sm text-on-surface-variant">
              ⏳ Payment for {subscription.pendingRequest.planMonths} month
              {subscription.pendingRequest.planMonths > 1 ? "s" : ""} is under
              review (submitted{" "}
              {new Date(subscription.pendingRequest.submittedAt).toLocaleString()}).
            </Text>
          </View>
        ) : null}
      </View>

      {/* Plan selector */}
      <View>
        <Text className="text-base font-bold text-on-background mb-3">
          1. Choose a Plan
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
              <View>
                <Text
                  className={`font-semibold ${
                    selectedPlan === plan.months ? "text-primary" : "text-on-surface"
                  }`}
                >
                  {plan.label}
                </Text>
                <Text className="text-xs text-on-surface-variant">{plan.hint}</Text>
              </View>
              <Text className="font-bold text-on-surface">
                ETB{" "}
                {(
                  (subscription?.monthlyPriceEtb ?? 1000) * plan.months
                ).toLocaleString()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Payment instructions */}
      <View className="bg-surface rounded-2xl p-5 border border-outline-variant/30 gap-2">
        <Text className="text-base font-bold text-on-background">
          2. Send the payment
        </Text>
        <Text className="text-sm text-on-surface-variant">
          Transfer ETB{" "}
          <Text className="font-bold">
            {((subscription?.monthlyPriceEtb ?? 1000) * selectedPlan).toLocaleString()}
          </Text>{" "}
          to our account:
        </Text>
        <View className="bg-surface-container-low rounded-xl p-3 gap-1">
          <Text className="text-sm text-on-surface">Telebirr / Bank: 0900-000-000</Text>
          <Text className="text-sm text-on-surface">Account name: KixLabs Software</Text>
          <Text className="text-xs text-outline mt-1">
            (Update these details in server config before going live)
          </Text>
        </View>
      </View>

      {/* Screenshot upload */}
      <View>
        <Text className="text-base font-bold text-on-background mb-3">
          3. Upload payment screenshot
        </Text>
        <View className="flex-row gap-2 mb-3">
          <Pressable
            onPress={pickScreenshot}
            className="flex-1 bg-surface border border-outline-variant/30 rounded-xl p-4 items-center gap-2"
          >
            <Upload size={20} color="#004ac6" />
            <Text className="text-sm text-primary font-semibold">Choose photo</Text>
          </Pressable>
          {Platform.OS !== "web" ? (
            <Pressable
              onPress={takePhoto}
              className="flex-1 bg-surface border border-outline-variant/30 rounded-xl p-4 items-center gap-2"
            >
              <CreditCard size={20} color="#004ac6" />
              <Text className="text-sm text-primary font-semibold">Take photo</Text>
            </Pressable>
          ) : null}
        </View>

        {screenshot ? (
          <View className="bg-surface rounded-2xl border border-outline-variant/30 p-3 gap-2">
            <Image
              source={{ uri: screenshot.uri }}
              className="w-full h-48 rounded-xl"
              resizeMode="cover"
            />
            <Text className="text-xs text-on-surface-variant">
              {screenshot.fileName ?? "screenshot.jpg"} — tap Submit below
            </Text>
          </View>
        ) : null}

        <Text className="text-sm text-on-surface-variant mt-3 mb-1">
          Bank / transaction reference (optional)
        </Text>
        <Text className="text-on-surface-variant text-sm">
          e.g. the telebirr transaction ID on the receipt
        </Text>

        <Pressable
          onPress={handleSubmit}
          disabled={submitMutation.isPending || !screenshot}
          className="bg-primary rounded-xl py-4 items-center mt-3"
          style={{
            opacity: submitMutation.isPending || !screenshot ? 0.5 : 1,
          }}
        >
          <Text className="text-white font-semibold">
            {submitMutation.isPending ? "Uploading…" : "Submit payment proof"}
          </Text>
        </Pressable>
      </View>

      {/* Payment history */}
      <View>
        <Text className="text-base font-bold text-on-background mb-3">
          Payment History
        </Text>
        {(payments ?? []).length === 0 ? (
          <Text className="text-on-surface-variant text-sm">No payments yet</Text>
        ) : (
          <View className="gap-2">
            {payments.map((p) => {
              const status = PAYMENT_STATUS[p.status] ?? {
                label: p.status,
                color: "#737686",
              };
              return (
                <View
                  key={p.id}
                  className="bg-surface p-4 rounded-xl border border-outline-variant/30 flex-row justify-between items-center"
                >
                  <View>
                    <Text className="font-medium text-on-surface">
                      {p.planMonths} month{p.planMonths > 1 ? "s" : ""} — ETB{" "}
                      {Number(p.amountEtb).toLocaleString()}
                    </Text>
                    <Text className="text-xs text-on-surface-variant mt-0.5">
                      {new Date(p.submittedAt).toLocaleDateString()}
                      {p.reviewNote ? ` · ${p.reviewNote}` : ""}
                    </Text>
                  </View>
                  <Text className="text-xs font-bold" style={{ color: status.color }}>
                    {status.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
