import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CustomSidebar } from "../../components/CustomSidebar";
import { AppHeader } from "../../components/AppHeader";
import { useAuth } from "../../context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function AppLayout() {
  const { shop, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomSidebar {...props} shop={shop} />}
        screenOptions={{
          headerShown: true,
          header: (props) => <AppHeader {...props} shop={shop} />,
          drawerType: "front",
          drawerStyle: { width: "80%" },
          overlayColor: "rgba(11,28,48,0.4)",
          swipeEdgeWidth: 60,
        }}
      >
        <Drawer.Screen name="overview" options={{ title: "Overview" }} />
        <Drawer.Screen name="inventory" options={{ title: "Inventory" }} />
        <Drawer.Screen name="finance" options={{ title: "Finance" }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
