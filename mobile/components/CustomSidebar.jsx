import { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { router, usePathname } from "expo-router"; // 1. Added usePathname

import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import {
  LayoutGrid,
  Wallet,
  Package,
  Stethoscope,
  Users,
  ShoppingCart,
  AlertTriangle,
  Receipt,
  History,
  PiggyBank,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Calendar,
  ChevronDown,
  ChevronRight,
  Activity,
  BarChart2,
} from "lucide-react-native";
import { useExpiringBatches } from "../hooks/useBatches";
const OVERVIEW_ITEMS = [
  { group: "overview", target: "index", label: "Dashboard", icon: LayoutGrid },
  { group: "overview", target: "activity", label: "Activity", icon: Activity },
  {
    group: "overview",
    target: "analytics",
    label: "Analytics",
    icon: BarChart2,
  },
  { group: "overview", target: "alerts", label: "Alerts", icon: AlertTriangle },
];

const INVENTORY_ITEMS = [
  {
    group: "inventory",
    target: "index",
    label: "Inventory Overview",
    icon: Package,
  },
  {
    group: "inventory",
    target: "medicines",
    label: "Medicines",
    icon: Stethoscope,
  },
  { group: "inventory", target: "suppliers", label: "Suppliers", icon: Users },
  {
    group: "inventory",
    target: "purchases",
    label: "Purchase Orders",
    icon: ShoppingCart,
  },
  {
    group: "inventory",
    target: "expiring",
    label: "Expiring Soon",
    icon: AlertTriangle,
    danger: true,
  },
];

const FINANCE_ITEMS = [
  { group: "finance", target: "index", label: "Overview", icon: Wallet },
  { group: "finance", target: "sales", label: "Sales", icon: Receipt },
  { group: "finance", target: "expenses", label: "Expenses", icon: History },
  {
    group: "finance",
    target: "profit",
    label: "Profit & Loss",
    icon: PiggyBank,
  },
];

const FOOTER_ITEMS = [
  { name: "notifications", label: "Notifications", icon: Bell, dot: true },
  { name: "settings", label: "Settings", icon: Settings },
  { name: "help", label: "Help & Support", icon: HelpCircle },
];

export function CustomSidebar({ pharmacy, ...props }) {
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const pathname = usePathname(); // 2. Get current URL path (e.g. "/overview/alerts")
  const { logout } = useAuth();

  const { data: expiringData } = useExpiringBatches(30);
  const expiringCount = expiringData?.length ?? 0;

  const [openSections, setOpenSections] = useState({
    inventory: true,
    finance: true,
  });
  const [loggingOut, setLoggingOut] = useState(false);

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Helper to accurately match item against current URL path
  const isItemActive = (item) => {
    if (item.group) {
      const expectedPath =
        item.target === "index"
          ? `/${item.group}`
          : `/${item.group}/${item.target}`;
      // Exact match or handles trailing slash
      return pathname === expectedPath || pathname === `${expectedPath}/`;
    }
    if (item.name) {
      return (
        pathname === `/${item.name}` || pathname.startsWith(`/${item.name}/`)
      );
    }
    return false;
  };

  const handleNavigate = (item) => {
    if (item.group) {
      if (item.target === "expiring") {
        router.push({ pathname: "/inventory", params: { filter: "EXPIRING" } });
        return;
      }
      const targetPath = item.target === "index" ? "" : `/${item.target}`;
      router.push(`/${item.group}${targetPath}`);
    } else if (item.name) {
      router.push(`/${item.name}`);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      router.replace("login");
    }
  };
  const inventoryItems = INVENTORY_ITEMS.map((item) =>
    item.target === "expiring"
      ? {
          ...item,
          badge: expiringCount > 0 ? String(expiringCount) : undefined,
        }
      : item,
  );
  return (
    <View className="flex-1 bg-surface">
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0, flexGrow: 1 }}
      >
        {/* Header */}
        <View
          className="px-4 pb-4 border-b border-outline-variant/30 gap-4"
          style={{ paddingTop: insets.top + 16 }}
        >
          {/* Brand */}
          <View className="flex-row items-center gap-2">
            <View className="w-10 h-10 bg-primary-container rounded-lg items-center justify-center">
              <Stethoscope size={20} color="#eeefff" strokeWidth={2.2} />
            </View>
            <Text className="text-[20px] font-bold text-primary">
              KLABS Pharmacy
            </Text>
          </View>

          {/* Profile */}
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-surface-container-high overflow-hidden border-2 border-primary/10">
              <Image
                source={{ uri: "https://your-avatar-url.com/avatar.jpg" }}
                className="w-full h-full"
              />
            </View>
            <View>
              <Text className="text-[16px] font-semibold text-on-surface">
                {pharmacy?.name}
              </Text>
              <Text className="text-[12px] text-on-surface-variant">
                {pharmacy?.phone}
              </Text>
            </View>
          </View>

          {/* Pharmacy meta card */}
          <Pressable onPress={() => navigation.navigate(`subscription`)}>
            <View className="bg-surface-container-low p-2 rounded-xl gap-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] font-semibold text-on-surface-variant">
                  {pharmacy?.name}
                </Text>
                <View className="bg-primary/10 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-primary">
                    {pharmacy?.subscriptionStatus}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-1">
                <Calendar size={13} color="#004ac6" />
                <Text className="text-[11px] font-medium text-secondary">
                  {pharmacy?.subscriptionStatus === "PRO"
                    ? "Pro Plan (14 days left)"
                    : "Basic Plan"}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Nav sections */}
        <View className="px-3 pt-4 gap-5">
          <Section title="OVERVIEW">
            {OVERVIEW_ITEMS.map((item) => (
              <NavItem
                key={`${item.group}-${item.target}`}
                item={item}
                isActive={isItemActive(item)}
                onPress={() => handleNavigate(item)}
              />
            ))}
          </Section>

          <CollapsibleSection
            title="INVENTORY"
            open={openSections.inventory}
            onToggle={() => toggleSection("inventory")}
          >
            {inventoryItems.map((item) => (
              <NavItem
                key={`${item.group}-${item.target}`}
                item={item}
                isActive={isItemActive(item)}
                onPress={() => handleNavigate(item)}
              />
            ))}
          </CollapsibleSection>

          <CollapsibleSection
            title="FINANCE"
            open={openSections.finance}
            onToggle={() => toggleSection("finance")}
          >
            {FINANCE_ITEMS.map((item) => (
              <NavItem
                key={`${item.group}-${item.target}`}
                item={item}
                isActive={isItemActive(item)}
                onPress={() => handleNavigate(item)}
              />
            ))}
          </CollapsibleSection>
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <View
        className="px-3 border-t border-outline-variant/30 pt-2 gap-1"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {FOOTER_ITEMS.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            isActive={isItemActive(item)}
            onPress={() => handleNavigate(item)}
          />
        ))}

        <Pressable
          onPress={handleLogout}
          disabled={loggingOut}
          className="flex-row items-center gap-3 px-3 py-3 rounded-lg mt-1"
          style={{ opacity: loggingOut ? 0.5 : 1 }}
        >
          <LogOut size={20} strokeWidth={2.2} color="#BA1A1A" />
          <Text className="text-[15px] font-medium text-error">
            {loggingOut ? "Logging out..." : "Log Out"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View>
      <Text className="px-3 text-[12px] font-semibold tracking-wide text-outline mb-2">
        {title}
      </Text>
      <View className="gap-1">{children}</View>
    </View>
  );
}

function CollapsibleSection({ title, open, onToggle, children }) {
  return (
    <View>
      <Pressable
        onPress={onToggle}
        className="flex-row items-center justify-between px-3 mb-2"
      >
        <Text className="text-[12px] font-semibold tracking-wide text-outline">
          {title}
        </Text>
        {open ? (
          <ChevronDown size={16} color="#737686" />
        ) : (
          <ChevronRight size={16} color="#737686" />
        )}
      </Pressable>
      {open ? <View className="gap-1">{children}</View> : null}
    </View>
  );
}

function NavItem({ item, isActive, onPress }) {
  const Icon = item.icon;
  const iconColor = isActive ? "#004ac6" : item.danger ? "#BA1A1A" : "#434655";
  const textColor = isActive
    ? "text-primary font-bold"
    : item.danger
      ? "text-error"
      : "text-on-surface-variant";

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-3 py-3 rounded-lg ${
        isActive ? "bg-secondary-container" : ""
      }`}
    >
      <Icon size={20} strokeWidth={2.2} color={iconColor} />
      <Text className={`flex-1 text-[15px] ${textColor}`}>{item.label}</Text>

      {item.badge ? (
        <View className="bg-error-container px-2 py-0.5 rounded-full">
          <Text className="text-[10px] font-bold text-on-error-container">
            {item.badge}
          </Text>
        </View>
      ) : null}

      {item.dot ? <View className="w-2 h-2 rounded-full bg-primary" /> : null}
    </Pressable>
  );
}
