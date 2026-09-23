import { View, Text, Pressable, Linking } from "react-native";
import {
  Building2,
  Phone,
  MapPin,
  Trash2,
  ChevronRight,
  BadgeCheck,
  PhoneCall,
  Navigation,
} from "lucide-react-native";

export default function SupplierCard({ supplier, onPress, onDelete }) {
  const { name, phone, address } = supplier;

  // Extract initial for depot storefront badge
  const initial = name ? name.charAt(0).toUpperCase() : "S";

  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleMap = () => {
    if (address) {
      const query = encodeURIComponent(address);
      Linking.openURL(`https://maps.google.com/?q=${query}`);
    }
  };

  return (
    <View className="bg-surface rounded-2xl border border-outline-variant/40 overflow-hidden shadow-xs">
      {/* Main Interactive Body */}
      <Pressable
        onPress={onPress}
        className="p-4 active:bg-surface-container-low"
      >
        {/* Top Header: Store Avatar, Name & Verification Badge */}
        <View className="flex-row items-start gap-3">
          {/* Storefront Initial Emblem */}
          <View className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center flex-shrink-0 relative">
            <Text className="text-lg font-black text-primary">{initial}</Text>
            <View className="absolute -bottom-1 -right-1 bg-surface rounded-full p-0.5">
              <Building2 size={12} color="#004ac6" />
            </View>
          </View>

          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <Text
                className="font-bold text-base text-on-surface"
                numberOfLines={1}
              >
                {name}
              </Text>
              <BadgeCheck size={16} color="#004ac6" />
            </View>

            <Text className="text-[11px] font-semibold text-primary/80 uppercase tracking-wider mt-0.5">
              Verified Distributor
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <ChevronRight size={18} color="#c3c6d7" />
          </View>
        </View>

        {/* Location & Details Info */}
        {address ? (
          <Pressable
            onPress={handleMap}
            className="flex-row items-center gap-1.5 mt-3 bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/20"
          >
            <MapPin size={14} color="#6d7185" />
            <Text
              className="text-xs font-medium text-on-surface-variant flex-1"
              numberOfLines={1}
            >
              {address}
            </Text>
            <Navigation size={12} color="#004ac6" />
          </Pressable>
        ) : null}
      </Pressable>

      {/* Quick Action Footer: One-Tap Contact */}
      <View className="flex-row items-center border-t border-outline-variant/20 bg-surface-variant/20">
        <Pressable
          onPress={handleCall}
          className="flex-1 flex-row items-center justify-center gap-2 py-3 active:bg-primary/10"
        >
          <PhoneCall size={14} color="#004ac6" />
          <Text className="text-xs font-bold text-primary">
            Call Supplier ({phone})
          </Text>
        </Pressable>

        <View className="w-[1px] h-6 bg-outline-variant/30" />

        <Pressable
          onPress={onPress}
          className="flex-1 flex-row items-center justify-center gap-1.5 py-3 active:bg-surface-container-high"
        >
          <Text className="text-xs font-semibold text-on-surface-variant">
            View Depot Info
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
