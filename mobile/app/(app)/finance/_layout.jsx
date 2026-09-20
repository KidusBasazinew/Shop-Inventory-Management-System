// app/(app)/finance/_layout.jsx
import { Tabs } from "expo-router";
import { CustomTabBar } from "../../../components/CustomTabBar";
import { Landmark, TrendingUp, Receipt, PiggyBank } from "lucide-react-native";

const icons = {
  index: Landmark,
  sales: TrendingUp,
  expenses: Receipt,
  profit: PiggyBank,
};

export default function FinanceLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} icons={icons} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Finance" }} />
      <Tabs.Screen name="sales" options={{ title: "Sales" }} />
      <Tabs.Screen name="expenses" options={{ title: "Expenses" }} />
      <Tabs.Screen name="profit" options={{ title: "Profit" }} />
    </Tabs>
  );
}
