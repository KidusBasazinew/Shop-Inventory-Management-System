import { Boxes, Package2, Truck, ShoppingCart } from "lucide-react-native";
import { Tabs } from "expo-router";
import { CustomTabBar } from "../../../components/CustomTabBar";
const icons = {
  index: Boxes,
  products: Package2,
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
      <Tabs.Screen name="products" options={{ title: "Products" }} />
      <Tabs.Screen name="suppliers" options={{ title: "Suppliers" }} />
      <Tabs.Screen name="purchases" options={{ title: "Purchases" }} />
    </Tabs>
  );
}
