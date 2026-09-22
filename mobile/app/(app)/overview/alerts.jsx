import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import SectionHeader from "../../../components/common/SectionHeader";
import NotificationCard from "../../../components/notifications/NotificationCard";

import { SPACING } from "../../../theme/theme";
import { useShop } from "../../../hooks/useShop";
import {
  useLowStockProducts,
  useExpiringProducts,
} from "../../../hooks/useProducts";
import { useStockMovements } from "../../../hooks/useStockMovements";

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function relativeDay(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "today";
  if (isSameDay(date, yesterday)) return "yesterday";
  return "earlier";
}

function formatTime(dateStr) {
  const hours = Math.round(
    (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60),
  );
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AlertsScreen() {
  const { shop } = useShop();
  const { data: lowStockData, isLoading: lowStockLoading } =
    useLowStockProducts();
  const { data: expiringData, isLoading: expiringLoading } =
    useExpiringProducts(30);
  const { data: movementsData, isLoading: movementsLoading } =
    useStockMovements({
      type: "PURCHASE",
      limit: 20,
    });

  const lowStock = lowStockData?.items ?? [];
  const expiring = expiringData?.items ?? [];

  const [readIds, setReadIds] = useState(new Set());
  const markAsRead = (id) => setReadIds((prev) => new Set(prev).add(id));

  const attentionItems = useMemo(() => {
    const items = [];

    lowStock.forEach((p) => {
      const isOut = Number(p.quantity) === 0;
      items.push({
        id: `low-stock-${p.id}`,
        severity: isOut ? "critical" : "warning",
        title: isOut ? "Out of Stock" : "Low Stock Alert",
        time: "Now",
        description: `${p.name} — ${p.quantity} ${p.unitType?.toLowerCase() ?? "units"} left (reorder at ${p.minQuantityAlert}).`,
        actionLabel: "VIEW PRODUCTS",
        onActionPress: () => router.push("(app)/inventory/medicines"),
      });
    });

    expiring.forEach((p) => {
      const daysLeft = daysUntil(p.expiryDate);
      items.push({
        id: `expiring-${p.id}`,
        severity: daysLeft <= 14 ? "critical" : "warning",
        title: "Expiry Warning",
        time: "Now",
        description: `${p.name} — ${p.quantity} units expire in ${daysLeft}d.`,
      });
    });

    if (shop?.subscriptionStatus === "TRIAL" && shop?.trialEnd) {
      const daysLeft = daysUntil(shop.trialEnd);
      if (daysLeft <= 7) {
        items.push({
          id: "trial-ending",
          severity: "neutral",
          title: "Trial Ending Soon",
          time: "Now",
          description: `Your trial ends in ${daysLeft}d. Renew now to keep full access.`,
          actionLabel: "RENEW PLAN",
          onActionPress: () => router.push("/subscription"),
        });
      }
    }

    const order = { critical: 0, warning: 1, neutral: 2 };
    return items.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [lowStock, expiring, shop]);

  const activityBuckets = useMemo(() => {
    const buckets = { today: [], yesterday: [], earlier: [] };
    (movementsData?.items ?? []).forEach((mv) => {
      const bucket = relativeDay(mv.createdAt);
      buckets[bucket].push({
        id: `movement-${mv.id}`,
        severity: "success",
        title: "Stock Arrived",
        time: formatTime(mv.createdAt),
        description: `${mv.product?.name ?? "Product"} — +${mv.quantity} units added.`,
      });
    });
    return buckets;
  }, [movementsData]);

  const isLoading = lowStockLoading || expiringLoading || movementsLoading;
  const isEmpty =
    !isLoading &&
    attentionItems.length === 0 &&
    activityBuckets.today.length === 0 &&
    activityBuckets.yesterday.length === 0 &&
    activityBuckets.earlier.length === 0;

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
        {attentionItems.length > 0 ? (
          <View style={{ gap: SPACING.cardGap }}>
            <SectionHeader label="Needs Attention" />
            {attentionItems.map((n) => (
              <NotificationCard
                key={n.id}
                severity={n.severity}
                title={n.title}
                time={n.time}
                description={n.description}
                actionLabel={n.actionLabel}
                unread={!readIds.has(n.id)}
                onPress={() => markAsRead(n.id)}
                onActionPress={n.onActionPress ?? (() => {})}
              />
            ))}
          </View>
        ) : null}

        {/* {["today", "Today"], ["yesterday", "Yesterday"], ["earlier", "Earlier"]} */}
        {activityBuckets.today.length > 0 ? (
          <View style={{ gap: SPACING.cardGap }}>
            <SectionHeader label="Today" />
            {activityBuckets.today.map((n) => (
              <NotificationCard
                key={n.id}
                severity={n.severity}
                title={n.title}
                time={n.time}
                description={n.description}
                unread={!readIds.has(n.id)}
                onPress={() => markAsRead(n.id)}
              />
            ))}
          </View>
        ) : null}

        {activityBuckets.yesterday.length > 0 ? (
          <View style={{ gap: SPACING.cardGap }}>
            <SectionHeader label="Yesterday" />
            {activityBuckets.yesterday.map((n) => (
              <NotificationCard
                key={n.id}
                severity={n.severity}
                title={n.title}
                time={n.time}
                description={n.description}
                unread={!readIds.has(n.id)}
                onPress={() => markAsRead(n.id)}
              />
            ))}
          </View>
        ) : null}

        {activityBuckets.earlier.length > 0 ? (
          <View style={{ gap: SPACING.cardGap }}>
            <SectionHeader label="Earlier" />
            {activityBuckets.earlier.map((n) => (
              <NotificationCard
                key={n.id}
                severity={n.severity}
                title={n.title}
                time={n.time}
                description={n.description}
                unread={!readIds.has(n.id)}
                onPress={() => markAsRead(n.id)}
              />
            ))}
          </View>
        ) : null}

        {isEmpty ? (
          <View
            style={{
              alignItems: "center",
              paddingTop: SPACING.xl * 2,
              gap: SPACING.sm,
            }}
          >
            <SectionHeader label="All caught up" />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
