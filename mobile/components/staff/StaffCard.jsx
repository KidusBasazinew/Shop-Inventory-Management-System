import { View, Text, Pressable, Linking } from "react-native";
import {
  Crown,
  ShieldCheck,
  Receipt,
  Phone,
  PhoneCall,
  ChevronRight,
  UserX,
  Pencil,
} from "lucide-react-native";

const ROLE_STYLES = {
  OWNER: {
    color: "#004ac6",
    bg: "bg-primary/10",
    border: "border-primary/20",
    icon: Crown,
    label: "Owner",
  },
  MANAGER: {
    color: "#7c3aed",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: ShieldCheck,
    label: "Manager",
  },
  CASHIER: {
    color: "#10b981",
    bg: "bg-emerald/10",
    border: "border-emerald/20",
    icon: Receipt,
    label: "Cashier",
  },
};

export default function StaffCard({ staff, isOwner, onPress, onDeactivate }) {
  const { fullName, phone, role, isActive } = staff;
  const roleStyle = ROLE_STYLES[role] ?? ROLE_STYLES.CASHIER;
  const RoleIcon = roleStyle.icon;
  const initial = fullName ? fullName.charAt(0).toUpperCase() : "S";

  const canManage = isOwner && role !== "OWNER";

  const handleCall = () => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <View
      className={`bg-surface rounded-2xl border overflow-hidden shadow-xs ${!isActive ? "opacity-60" : ""}`}
      style={{ borderColor: "rgba(0,0,0,0.08)" }}
    >
      <Pressable
        onPress={canManage ? onPress : undefined}
        className="p-4 active:bg-surface-container-low"
      >
        <View className="flex-row items-start gap-3">
          {/* Avatar emblem */}
          <View
            className={`w-12 h-12 rounded-2xl ${roleStyle.bg} border ${roleStyle.border} items-center justify-center flex-shrink-0 relative`}
          >
            <Text
              className="text-lg font-black"
              style={{ color: roleStyle.color }}
            >
              {initial}
            </Text>
            <View className="absolute -bottom-1 -right-1 bg-surface rounded-full p-0.5">
              <RoleIcon size={12} color={roleStyle.color} />
            </View>
          </View>

          <View className="flex-1 min-w-0">
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <Text
                className="font-bold text-base text-on-surface"
                numberOfLines={1}
              >
                {fullName}
              </Text>
              {!isActive ? (
                <View className="bg-error-container px-2 py-0.5 rounded-full">
                  <Text className="text-[9px] font-bold text-on-error-container">
                    INACTIVE
                  </Text>
                </View>
              ) : null}
            </View>

            <Text
              className="text-[11px] font-semibold uppercase tracking-wider mt-0.5"
              style={{ color: roleStyle.color, opacity: 0.85 }}
            >
              {roleStyle.label}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            {canManage && isActive ? (
              <Pressable
                onPress={onDeactivate}
                hitSlop={10}
                className="p-2 rounded-full active:bg-error/10"
              >
                <UserX size={16} color="#BA1A1A" />
              </Pressable>
            ) : null}
            {canManage ? <ChevronRight size={18} color="#c3c6d7" /> : null}
          </View>
        </View>

        {/* Phone row */}
        {phone ? (
          <View className="flex-row items-center gap-1.5 mt-3 bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/20">
            <Phone size={14} color="#6d7185" />
            <Text
              className="text-xs font-medium text-on-surface-variant flex-1"
              numberOfLines={1}
            >
              {phone}
            </Text>
          </View>
        ) : null}
      </Pressable>

      {/* Quick action footer */}
      <View className="flex-row items-center border-t border-outline-variant/20 bg-surface-variant/20">
        <Pressable
          onPress={handleCall}
          disabled={!phone}
          className="flex-1 flex-row items-center justify-center gap-2 py-3 active:bg-primary/10"
        >
          <PhoneCall size={14} color="#004ac6" />
          <Text className="text-xs font-bold text-primary">Call</Text>
        </Pressable>

        <View className="w-[1px] h-6 bg-outline-variant/30" />

        <Pressable
          onPress={canManage ? onPress : undefined}
          disabled={!canManage}
          className="flex-1 flex-row items-center justify-center gap-1.5 py-3 active:bg-surface-container-high"
        >
          {canManage ? <Pencil size={13} color="#565e74" /> : null}
          <Text className="text-xs font-semibold text-on-surface-variant">
            {role === "OWNER"
              ? "Owner Account"
              : canManage
                ? "Edit Profile"
                : "View Only"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
