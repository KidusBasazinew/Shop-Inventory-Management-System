import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import {
  User,
  Store,
  Users,
  Briefcase,
  ChevronRight,
  Pencil,
  X,
  Volume2,
  Vibrate,
} from "lucide-react-native";
import Switch from "../../components/common/Switch";
import {
  isSoundEnabled,
  isHapticsEnabled,
  setSoundEnabled,
  setHapticsEnabled,
  playTap,
  playSuccess,
  playError,
} from "../../lib/feedback";
import { useAuth } from "../../context/AuthContext";
import { useShop, useUpdateShop } from "../../hooks/useShop";
import SheetModal from "../../components/common/SheetModal";

export default function Settings() {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled());

  const { user } = useAuth();
  const { shop } = useShop();
  const isOwner = user?.role === "OWNER";
  const canManageStaff = user?.role === "OWNER" || user?.role === "MANAGER";

  const [editVisible, setEditVisible] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    phone: "",
    ownerName: "",
    taxRatePercent: "",
  });
  const updateShop = useUpdateShop();

  const openEdit = () => {
    setForm({
      name: shop?.name ?? "",
      location: shop?.location ?? "",
      phone: shop?.phone ?? "",
      ownerName: shop?.ownerName ?? "",
      taxRatePercent:
        shop?.taxRatePercent != null ? String(shop.taxRatePercent) : "0",
    });
    setEditVisible(true);
  };

  const handleSave = async () => {
    try {
      await updateShop.mutateAsync({
        name: form.name,
        location: form.location,
        phone: form.phone,
        ownerName: form.ownerName,
        taxRatePercent: Number(form.taxRatePercent) || 0,
      });
      playSuccess();
      setEditVisible(false);
    } catch (e) {
      playError();
      Alert.alert("Error", e?.response?.data?.error ?? "Failed to update shop");
    }
  };

  const toggleSound = async (value) => {
    setSoundOn(value);
    await setSoundEnabled(value);
    if (value) playTap();
  };

  const toggleHaptics = async (value) => {
    setHapticsOn(value);
    await setHapticsEnabled(value);
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 20, gap: 24 }}
    >
      {/* Account */}
      <View>
        <Text className="text-[13px] font-semibold text-on-surface mb-3">
          Account
        </Text>
        <View className="rounded-2xl p-4 flex-row items-center gap-3 border border-outline-variant/20">
          <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
            <User size={20} color="#004ac6" strokeWidth={1.75} />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-on-surface">
              {user?.name ?? "—"}
            </Text>
            <Text className="text-[13px] text-on-surface-variant mt-0.5">
              {user?.phone ?? "—"}
            </Text>
          </View>
          <View className="bg-primary/10 px-2.5 py-1 rounded-full">
            <Text className="text-[11px] font-bold text-primary">
              {user?.role}
            </Text>
          </View>
        </View>
      </View>

      {/* Shop */}
      <View>
        <Text className="text-[13px] font-semibold text-on-surface mb-3">
          Shop
        </Text>
        <View className="rounded-2xl p-4 border border-outline-variant/20">
          <View className="flex-row items-start justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                <Store size={20} color="#004ac6" strokeWidth={1.75} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-on-surface">
                  {shop?.name ?? "—"}
                </Text>
                <Text className="text-[13px] text-on-surface-variant mt-0.5">
                  {shop?.location ?? "No location set"}
                </Text>
                <Text className="text-[12px] text-on-surface-variant mt-0.5">
                  VAT rate: {shop?.taxRatePercent ?? 0}%
                </Text>
              </View>
            </View>
            {isOwner ? (
              <Pressable onPress={openEdit} hitSlop={10} className="p-1">
                <Pencil size={16} color="#9aa0a6" />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      {/* Preferences */}
      <View>
        <Text className="text-[13px] font-semibold text-on-surface mb-3">
          Preferences
        </Text>
        <View className="rounded-2xl overflow-hidden border border-outline-variant/20">
          <View className="flex-row items-center gap-3 px-4 py-4 border-b border-outline-variant/15">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <Volume2 size={18} color="#004ac6" strokeWidth={1.75} />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-medium text-on-surface">
                Sound Effects
              </Text>
              <Text className="text-[12px] text-on-surface-variant mt-0.5">
                Play a sound on sales and confirmations
              </Text>
            </View>
            <Switch value={soundOn} onValueChange={toggleSound} />
          </View>

          <View className="flex-row items-center gap-3 px-4 py-4">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <Vibrate size={18} color="#004ac6" strokeWidth={1.75} />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-medium text-on-surface">
                Haptic Feedback
              </Text>
              <Text className="text-[12px] text-on-surface-variant mt-0.5">
                Vibrate on taps and confirmations
              </Text>
            </View>
            <Switch value={hapticsOn} onValueChange={toggleHaptics} />
          </View>
        </View>
      </View>

      {/* Menu rows */}
      <View>
        <Text className="text-[13px] font-semibold text-on-surface mb-3">
          Manage
        </Text>
        <View className="rounded-2xl overflow-hidden border border-outline-variant/20">
          {canManageStaff ? (
            <MenuRow
              icon={Users}
              label="Staff Management"
              subtitle="Add, edit, or deactivate staff"
              onPress={() => router.push("/staff-management")}
              bordered
            />
          ) : null}
          {canManageStaff ? (
            <MenuRow
              icon={Briefcase}
              label="Employees & Payroll"
              subtitle="Manage employees and pay runs"
              onPress={() => router.push("/employees")}
            />
          ) : null}
        </View>
      </View>

      {/* Edit shop modal */}
      <SheetModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        snapPoints={["55%", "90%"]}
        initialIndex={1}
      >
        <View style={{ flexGrow: 1, padding: 24, gap: 16, paddingBottom: 80 }}>
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-on-surface">Edit Shop</Text>
            <Pressable onPress={() => setEditVisible(false)}>
              <X size={22} color="#434655" />
            </Pressable>
          </View>

          <BottomSheetTextInput
            placeholder="Shop name"
            value={form.name}
            onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
            placeholderTextColor="#737686"
            className="border border-outline-variant/40 rounded-xl px-4 py-3.5 text-[15px] text-on-surface"
          />
          <BottomSheetTextInput
            placeholder="Location"
            value={form.location}
            onChangeText={(v) => setForm((p) => ({ ...p, location: v }))}
            placeholderTextColor="#737686"
            className="border border-outline-variant/40 rounded-xl px-4 py-3.5 text-[15px] text-on-surface"
          />
          <BottomSheetTextInput
            placeholder="Shop phone"
            value={form.phone}
            onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
            keyboardType="phone-pad"
            placeholderTextColor="#737686"
            className="border border-outline-variant/40 rounded-xl px-4 py-3.5 text-[15px] text-on-surface"
          />
          <BottomSheetTextInput
            placeholder="Owner name"
            value={form.ownerName}
            onChangeText={(v) => setForm((p) => ({ ...p, ownerName: v }))}
            placeholderTextColor="#737686"
            className="border border-outline-variant/40 rounded-xl px-4 py-3.5 text-[15px] text-on-surface"
          />
          <BottomSheetTextInput
            placeholder="VAT / Tax rate (%)"
            value={form.taxRatePercent}
            onChangeText={(v) => setForm((p) => ({ ...p, taxRatePercent: v }))}
            keyboardType="decimal-pad"
            placeholderTextColor="#737686"
            className="border border-outline-variant/40 rounded-xl px-4 py-3.5 text-[15px] text-on-surface"
          />

          <Pressable
            onPress={handleSave}
            disabled={updateShop.isPending}
            className="bg-primary rounded-2xl py-4 items-center"
            style={{ opacity: updateShop.isPending ? 0.6 : 1 }}
          >
            <Text className="text-white font-semibold text-[15px]">
              {updateShop.isPending ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>
        </View>
      </SheetModal>
    </ScrollView>
  );
}

function MenuRow({ icon: Icon, label, subtitle, onPress, bordered }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 px-4 py-4 ${bordered ? "border-b border-outline-variant/15" : ""}`}
    >
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
        <Icon size={18} color="#004ac6" strokeWidth={1.75} />
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-medium text-on-surface">{label}</Text>
        {subtitle ? (
          <Text className="text-[12px] text-on-surface-variant mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={16} color="#9aa0a6" />
    </Pressable>
  );
}
