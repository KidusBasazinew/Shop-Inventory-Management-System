import { useState } from "react";
import { ScrollView, View } from "react-native";
import SectionHeader from "../../components/common/SectionHeader";
import NotificationCard from "../../components/notifications/NotificationCard";
import FAB from "../../components/common/FAB";
import { COLORS, SPACING } from "../../theme/theme";

// Replace with real data from your notifications API/query hook.
// `read: false` matches the two "today" cards in the design that show
// the unread dot and full-opacity card.
const MOCK_NOTIFICATIONS = {
  today: [
    {
      id: "1",
      severity: "critical",
      title: "Low Stock Alert",
      time: "2h ago",
      description:
        "Amoxicillin 500mg is below threshold (5 units left). Restock immediately to avoid shortage.",
      actionLabel: "ORDER NOW",
      read: false,
    },
    {
      id: "2",
      severity: "warning",
      title: "Expiry Warning",
      time: "5h ago",
      description:
        "3 Batches of Ibuprofen expiring in 30 days. Consider discounted clearance or returns.",
      read: false,
    },
  ],
  yesterday: [
    {
      id: "3",
      severity: "success",
      title: "Purchase Arrival",
      time: "Yesterday",
      description:
        "Order #PO-9921 arrived and stock added to inventory successfully.",
      read: true,
    },
    {
      id: "4",
      severity: "info",
      title: "Payment Reminder",
      time: "Yesterday",
      description:
        "Supplier 'MedSupply Co.' payment due in 2 days. Total amount: 12,450 ETB.",
      read: true,
    },
  ],
  earlier: [
    {
      id: "5",
      severity: "neutral",
      title: "Plan Subscription",
      time: "3 days ago",
      description:
        "Your Pro plan expires in 7 days. Renew now to maintain access to advanced analytics.",
      actionLabel: "RENEW PLAN",
      read: true,
    },
  ],
};

export default function AlertsScreen() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAsRead = (section, id) => {
    setNotifications((prev) => ({
      ...prev,
      [section]: prev[section].map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: SPACING.containerPadding,
          paddingTop: SPACING.lg,
          paddingBottom: SPACING.xl * 3, // clears FAB + bottom bar
          gap: SPACING.xl,
        }}
      >
        <View style={{ gap: SPACING.cardGap }}>
          <SectionHeader label="Today" />
          {notifications.today.map((n) => (
            <NotificationCard
              key={n.id}
              severity={n.severity}
              title={n.title}
              time={n.time}
              description={n.description}
              actionLabel={n.actionLabel}
              unread={!n.read}
              onPress={() => markAsRead("today", n.id)}
              onActionPress={() => {
                // wire up per-notification action (e.g. navigate to reorder flow)
              }}
            />
          ))}
        </View>

        <View style={{ gap: SPACING.cardGap }}>
          <SectionHeader label="Yesterday" />
          {notifications.yesterday.map((n) => (
            <NotificationCard
              key={n.id}
              severity={n.severity}
              title={n.title}
              time={n.time}
              description={n.description}
              unread={!n.read}
            />
          ))}
        </View>

        <View style={{ gap: SPACING.cardGap }}>
          <SectionHeader label="Earlier" />
          {notifications.earlier.map((n) => (
            <NotificationCard
              key={n.id}
              severity={n.severity}
              title={n.title}
              time={n.time}
              description={n.description}
              actionLabel={n.actionLabel}
              unread={!n.read}
              onActionPress={() => {
                // wire up renew-plan flow
              }}
            />
          ))}
        </View>
      </ScrollView>

      <View
        style={{
          position: "absolute",
          bottom: SPACING.xl * 3,
          right: SPACING.lg,
        }}
      >
        <FAB icon="help" onPress={() => {}} />
      </View>
    </View>
  );
}
