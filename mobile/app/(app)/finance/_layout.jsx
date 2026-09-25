import {
  Landmark,
  TrendingUp,
  Receipt,
  PiggyBank,
  Percent,
} from "lucide-react-native";
import { Tabs } from "expo-router";
import { CustomTabBar } from "../../../components/CustomTabBar";

const icons = {
  index: Landmark,
  sales: TrendingUp,
  expenses: Receipt,
  profit: PiggyBank,
  tax: Percent,
};

export default function FinanceLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} icons={icons} />}
      initialRouteName="index"
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Overview" }} />
      <Tabs.Screen name="sales" options={{ title: "Sales" }} />
      <Tabs.Screen name="expenses" options={{ title: "Expenses" }} />
      <Tabs.Screen name="profit" options={{ title: "Profit" }} />
      <Tabs.Screen name="tax" options={{ title: "Tax" }} />
    </Tabs>
  );
}
