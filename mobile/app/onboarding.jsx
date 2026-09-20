import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Dimensions,
  Pressable,
  StatusBar,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import {
  Pill,
  ScanBarcode,
  BarChart3,
  ArrowRight,
  Zap,
} from "lucide-react-native";
import Image1 from "../assets/png/Delivery-bro.png";
import Image2 from "../assets/png/Barcode-bro.png";
import Image3 from "../assets/png/Financial_data-bro.png";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ONBOARDING_KEY = "has_onboarded";

const SLIDES = [
  {
    id: "inventory",
    title: "Never sell expired stock",
    subtitle: "Batches are tracked automatically, oldest first.",
    icon: Pill,
    image: Image1,
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    id: "pos",
    title: "Checkout in seconds",
    subtitle: "Scan a barcode, done. No manual entry.",
    icon: ScanBarcode,
    image: Image2,
    color: "#059669",
    bg: "#ecfdf5",
  },
  {
    id: "finance",
    title: "Know your margins",
    subtitle: "Profit per sale, calculated for you.",
    icon: BarChart3,
    image: Image3,
    color: "#4f46e5",
    bg: "#eef2ff",
  },
];

export default function PremiumOnboarding() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const scrollX = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const handleMomentumEnd = (e) => {
    const newIdx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(newIdx);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/login");
  };

  return (
    <View className="flex-1 bg-white justify-between">
      <StatusBar barStyle="dark-content" />

      {/* Top bar: just a skip action, nothing else competing for attention */}
      <View className="pt-16 px-7 flex-row justify-end">
        <Pressable
          onPress={finishOnboarding}
          className="px-3 py-2 active:opacity-50"
        >
          <Text className="text-slate-400 font-semibold text-sm">Skip</Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        className="flex-1"
      >
        {SLIDES.map((slide, idx) => (
          <SlideCard
            key={slide.id}
            slide={slide}
            index={idx}
            scrollX={scrollX}
          />
        ))}
      </Animated.ScrollView>

      <View className="px-8 pb-12 gap-8">
        <View className="flex-row justify-center items-center gap-2">
          {SLIDES.map((_, i) => (
            <DotIndicator
              key={i}
              index={i}
              scrollX={scrollX}
              color={SLIDES[activeIndex].color}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={{ backgroundColor: SLIDES[activeIndex].color }}
          className="rounded-2xl py-4 flex-row items-center justify-center gap-2 active:opacity-90"
        >
          <Text className="text-white font-bold text-base">
            {activeIndex === SLIDES.length - 1 ? "Get Started" : "Continue"}
          </Text>
          {activeIndex === SLIDES.length - 1 ? (
            <Zap size={16} color="#ffffff" />
          ) : (
            <ArrowRight size={16} color="#ffffff" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function SlideCard({ slide, index, scrollX }) {
  const Icon = slide.icon;

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [0.9, 1, 0.9],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [0.3, 1, 0.3],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }], opacity };
  });

  return (
    <View
      style={{ width: SCREEN_WIDTH }}
      className="flex-1 justify-center items-center px-10"
    >
      <Animated.View style={animatedStyle} className="items-center w-full">
        {/* single, simple vector — one circle, one icon, no stacked badges */}
        <View
          style={{ backgroundColor: slide.bg }}
          className="w-80 h-80 rounded-full items-center justify-center mb-10"
        >
          {/* <Icon size={56} color={slide.color} strokeWidth={1.75} /> */}
          <Image
            source={slide.image}
            style={{ width: 320, height: 320 }}
            resizeMode="contain"
          />
        </View>

        <Text className="text-xl font-bold text-slate-900 text-center mb-2">
          {slide.title}
        </Text>

        <Text className="text-sm text-slate-500 text-center leading-5 px-6">
          {slide.subtitle}
        </Text>
      </Animated.View>
    </View>
  );
}

function DotIndicator({ index, scrollX, color }) {
  const animatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      scrollX.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [6, 20, 6],
      Extrapolation.CLAMP,
    );
    return { width, backgroundColor: color };
  });

  return (
    <Animated.View style={[{ height: 6, borderRadius: 3 }, animatedStyle]} />
  );
}
