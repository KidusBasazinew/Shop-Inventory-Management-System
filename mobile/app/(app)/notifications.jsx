import { ScrollView, View, Text, Pressable } from "react-native";
import { Bell, CheckCircle2, AlertTriangle, Info } from "lucide-react-native";
import { useNotifications, useMarkNotificationsRead } from "../../hooks/useNotifications";
import { COLORS, SPACING } from "../../theme/theme";

function iconFor(n) {
  if (n.severity === "critical") return <AlertTriangle size={20} color="#BA1A1A" />;
  if (n.severity === "warning") return <Bell size={20} color="#F9A825" />;
  if (n.severity === "success") return <CheckCircle2 size={20} color="#0F9D58" />;
  return <Info size={20} color="#004ac6" />;
}

/**
 * Platform notifications for the shop owner: subscription reminders
 * (3 / 2 / 1 days before expiry), payment verified / rejected, trial
 * ending, etc. Tap a notification to mark it read.
 */
export default function NotificationsScreen() {
  const { data: notifications, isLoading } = useNotifications(50);
  const markRead = useMarkNotificationsRead();

  const unread = (notifications ?? []).filter((n) => !n.isRead);
  const read = (notifications ?? []).filter((n) => n.isRead);

  const renderNotification = (n) => (
    <Pressable
      key={n.id}
      onPress={() => !n.isRead && markRead.mutate([n.id])}
      className={`p-4 rounded-2xl border ${
        n.isRead ? "bg-surface border-outline-variant/20" : "bg-surface-container-high border-primary/20"
      }`}
      style={{ opacity: n.isRead ? 0.7 : 1 }}
    >
      <View className="flex-row items-start gap-3">
        {iconFor(n)}
        <View className="flex-1 gap-1">
          <Text className="font-bold text-on-surface">{n.title}</Text>
          <Text className="text-sm text-on-surface-variant">{n.body}</Text>
          <Text className="text-[10px] text-outline mt-1">
            {new Date(n.createdAt).toLocaleString()}
            {n.isRead ? " · read" : " · tap to mark read"}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View className="bg-background flex-1">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.containerPadding,
          paddingTop: SPACING.lg,
          paddingBottom: SPACING.xl * 3,
          gap: SPACING.xl,
        }}
      >
        {isLoading ? (
          <Text className="text-on-surface-variant text-center">Loading notifications…</Text>
        ) : null}

        {unread.length > 0 ? (
          <View style={{ gap: SPACING.cardGap }}>
            <Text className="text-[12px] font-semibold tracking-wide text-outline">NEW</Text>
            {unread.map(renderNotification)}
          </View>
        ) : null}

        {read.length > 0 ? (
          <View style={{ gap: SPACING.cardGap }}>
            <Text className="text-[12px] font-semibold tracking-wide text-outline">EARLIER</Text>
            {read.map(renderNotification)}
          </View>
        ) : null}

        {!isLoading && (notifications ?? []).length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: SPACING.xl * 2 }}>
            <Text className="text-on-surface-variant">All caught up — no notifications.</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
