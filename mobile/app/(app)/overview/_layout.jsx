import { Tabs } from "expo-router";
import { CustomTabBar } from "../../../components/CustomTabBar";
import {
  LayoutDashboard,
  BarChart3,
  Bell,
  Activity,
} from "lucide-react-native";

const icons = {
  index: LayoutDashboard,
  analytics: BarChart3,
  alerts: Bell,
  activity: Activity,
};

export default function OverviewLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} icons={icons} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="analytics" options={{ title: "Analytics" }} />
      <Tabs.Screen name="alerts" options={{ title: "Alerts" }} />
      <Tabs.Screen name="activity" options={{ title: "Activity" }} />
    </Tabs>
  );
}
