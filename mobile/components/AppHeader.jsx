import { View, Text, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Menu, HelpCircle, Calendar } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ROUTE_TITLES = {
  overview: "Overview",
  inventory: "Inventory",
  finance: "Finance",
  notifications: "Notifications",
  settings: "Settings",
  help: "Help & Support",
  subscription: "Subscription",
};

const CURVE_ZONE_HEIGHT = 100; // depth at the corners
const CARD_HEIGHT = 76;
const CARD_TOP_OFFSET = 26; // how far into the curve zone the card sits

export function AppHeader({ navigation, route, shop }) {
  const insets = useSafeAreaInsets();
  const title = ROUTE_TITLES[route.name] ?? route.name;
  const isTrial = shop?.subscriptionStatus === "TRIAL";

  const iconRowHeight = insets.top + 68;

  return (
    <View
      className="bg-background"
      style={{ height: iconRowHeight + CURVE_ZONE_HEIGHT }}
    >
      {/* Flat icon row */}
      <View
        className="bg-primary"
        style={{
          height: iconRowHeight,
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
        }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => navigation.openDrawer()}
            hitSlop={10}
            className="w-10 h-10 rounded-full bg-white/15 items-center justify-center"
          >
            <Menu size={20} color="#ffffff" strokeWidth={2.4} />
          </Pressable>

          <Text className="text-white text-[17px] font-bold">{title}</Text>

          <Pressable
            onPress={() => navigation.navigate("help")}
            hitSlop={10}
            className="w-10 h-10 rounded-full bg-white/15 items-center justify-center"
          >
            <HelpCircle size={18} color="#ffffff" strokeWidth={2.4} />
          </Pressable>
        </View>
      </View>

      {/* Concave curve — corners deep, center shallow */}
      <Svg
        width={SCREEN_WIDTH}
        height={CURVE_ZONE_HEIGHT}
        style={{ position: "absolute", top: iconRowHeight, left: 0 }}
      >
        <Path
          d={`M0,0 H${SCREEN_WIDTH} V${CURVE_ZONE_HEIGHT} Q${SCREEN_WIDTH / 2},-40 0,${CURVE_ZONE_HEIGHT} Z`}
          fill="#004ac6"
        />
      </Svg>

      {/* Floating white card — nested into the shallow center of the curve */}
      <Pressable
        onPress={() => navigation.navigate("subscription")}
        style={{
          position: "absolute",
          top: iconRowHeight + CARD_TOP_OFFSET,
          left: 20,
          right: 20,
          height: CARD_HEIGHT,
        }}
      >
        <View
          className="bg-background rounded-2xl px-4 flex-row items-center justify-between flex-1"
          style={{
            elevation: 6,
            shadowColor: "#0b1c30",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
          }}
        >
          <View>
            <Text className="text-[11px] font-semibold text-on-surface-variant tracking-wide">
              SHOP
            </Text>
            <Text className="text-[15px] font-bold text-on-surface mt-0.5">
              {shop?.name ?? "—"}
            </Text>
          </View>

          <View className="items-end">
            <View className="bg-primary/10 px-2.5 py-1 rounded-full">
              <Text className="text-[10px] font-bold text-primary">
                {shop?.subscriptionStatus ?? "—"}
              </Text>
            </View>
            {isTrial && shop?.trialEnd ? (
              <View className="flex-row items-center gap-1 mt-1">
                <Calendar size={11} color="#565E74" />
                <Text className="text-[11px] font-medium text-secondary">
                  {Math.max(
                    0,
                    Math.ceil(
                      (new Date(shop.trialEnd) - new Date()) / 86400000,
                    ),
                  )}
                  d left
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}
