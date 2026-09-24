import {
  Boxes,
  Package2,
  Truck,
  ShoppingCart,
  Trash2,
} from "lucide-react-native";
import { CustomTabBar } from "../../../components/CustomTabBar";
import { Tabs } from "expo-router";
const icons = {
  index: Boxes,
  products: Package2,
  suppliers: Truck,
  purchases: ShoppingCart,
  waste: Trash2,
};

export default function InventoryLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} icons={icons} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Inventory" }} />
      <Tabs.Screen name="products" options={{ title: "Products" }} />
      <Tabs.Screen name="suppliers" options={{ title: "Suppliers" }} />
      <Tabs.Screen name="purchases" options={{ title: "Purchases" }} />
      <Tabs.Screen name="waste" options={{ title: "Waste" }} />
    </Tabs>
  );
}
