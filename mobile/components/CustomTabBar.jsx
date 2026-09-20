import { useEffect } from "react";
import { View, Pressable, Text, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BAR_HEIGHT = 66;
const CIRCLE_SIZE = 60;
const MASK_SIZE = CIRCLE_SIZE + 16;
const OVERLAP = 30;
const CONTAINER_PADDING = 10; // must match paddingHorizontal below

export function CustomTabBar({ state, descriptors, navigation, icons }) {
  const insets = useSafeAreaInsets();
  const tabCount = state.routes.length;

  // ✅ subtract the container's horizontal padding before dividing
  const barWidth = SCREEN_WIDTH - CONTAINER_PADDING * 2;
  const tabWidth = barWidth / tabCount;

  const translateX = useSharedValue(state.index * tabWidth);

  useEffect(() => {
    translateX.value = withSpring(state.index * tabWidth, {
      damping: 18,
      stiffness: 150,
    });
  }, [state.index, tabWidth]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      className="bg-background"
      style={{
        paddingHorizontal: CONTAINER_PADDING,
        paddingTop: 10,
        paddingBottom: insets.bottom + 10,
      }}
    >
      {/* Floating active circle */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: -BAR_HEIGHT + OVERLAP,
            left: 0,
            width: tabWidth,
            alignItems: "center",
            zIndex: 10,
          },
          circleStyle,
        ]}
      >
        <View
          className="items-center justify-center"
          style={{
            width: MASK_SIZE,
            height: MASK_SIZE,
            borderRadius: MASK_SIZE / 2,
          }}
        >
          <View
            className="bg-primary items-center justify-center border-t-4 border-l-4 border-r-4 border-b-4 border-[#fdf8fd] rounded-full"
            style={{
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              // borderRadius: CIRCLE_SIZE / 2,
              elevation: 8,
            }}
          >
            {(() => {
              const currentRouteName = state.routes[state.index].name;
              const ActiveIcon = icons[currentRouteName];
              return ActiveIcon ? (
                <ActiveIcon size={22} color="#FFFFFF" strokeWidth={2.4} />
              ) : (
                <View style={{ width: 22, height: 22 }} />
              );
            })()}
          </View>
        </View>
      </Animated.View>

      {/* Main bar */}
      <View
        style={{ height: BAR_HEIGHT }}
        className="flex-row bg-surface-container-high rounded-full border-t border-outline-variant/20"
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = options.title ?? route.name;
          const RouteIcon = icons[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              style={{ width: tabWidth }}
              className="items-center justify-end pb-2"
            >
              {isFocused ? (
                <Text className="text-[11px] font-semibold text-primary mb-1">
                  {label}
                </Text>
              ) : (
                <View className="items-center justify-center gap-1">
                  {RouteIcon ? (
                    <RouteIcon size={22} color="#79747E" strokeWidth={2} />
                  ) : (
                    <View style={{ width: 22, height: 22 }} />
                  )}
                  <Text className="text-[10px] font-medium text-on-surface-variant">
                    {label}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
