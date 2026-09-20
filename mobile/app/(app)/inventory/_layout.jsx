// app/(app)/inventory/_layout.jsx
import { Tabs } from "expo-router";
import { CustomTabBar } from "../../../components/CustomTabBar";
import { Boxes, Pill, Truck, ShoppingCart } from "lucide-react-native";

const icons = {
  index: Boxes,
  medicines: Pill,
  suppliers: Truck,
  purchases: ShoppingCart,
};

export default function InventoryLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} icons={icons} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Inventory" }} />
      <Tabs.Screen name="medicines" options={{ title: "Medicines" }} />
      <Tabs.Screen name="suppliers" options={{ title: "Suppliers" }} />
      <Tabs.Screen name="purchases" options={{ title: "Purchases" }} />
    </Tabs>
  );
}
