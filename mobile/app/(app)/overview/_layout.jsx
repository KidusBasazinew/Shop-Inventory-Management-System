import { Tabs } from "expo-router";

export default function OverviewLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
    </Tabs>
  );
}
