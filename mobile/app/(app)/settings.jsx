import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { router } from "expo-router";
import {
  User,
  Store,
  CreditCard,
  Users,
  ChevronRight,
  Pencil,
  X,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../hooks/useUser";
import { useUpdatePharmacy } from "../../hooks/usePharmacy";

export default function Settings() {
  const { user } = useAuth();
  const { pharmacy } = useUser();
  const isOwner = user?.role === "OWNER";
  const canManageStaff = user?.role === "OWNER" || user?.role === "MANAGER";

  const [editVisible, setEditVisible] = useState(false);
  const [form, setForm] = useState({ name: "", address: "" });
  const updatePharmacy = useUpdatePharmacy();

  const openEdit = () => {
    setForm({ name: pharmacy?.name ?? "", address: pharmacy?.address ?? "" });
    setEditVisible(true);
  };

  const handleSave = async () => {
    try {
      await updatePharmacy.mutateAsync(form);
      setEditVisible(false);
    } catch (e) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? "Failed to update pharmacy",
      );
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 20, gap: 24 }}
    >
      {/* Account */}
      <View>
        <Text className="text-[13px] font-semibold text-slate-900 mb-3">
          Account
        </Text>
        <View
          className="rounded-2xl p-4 flex-row items-center gap-3"
          style={{ borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" }}
        >
          <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center">
            <User size={20} color="#2563eb" strokeWidth={1.75} />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-slate-900">
              {user?.fullName ?? "—"}
            </Text>
            <Text className="text-[13px] text-slate-500 mt-0.5">
              {user?.phone ?? "—"}
            </Text>
          </View>
          <View className="bg-blue-50 px-2.5 py-1 rounded-full">
            <Text className="text-[11px] font-bold text-primary">
              {user?.role}
            </Text>
          </View>
        </View>
      </View>

      {/* Pharmacy */}
      <View>
        <Text className="text-[13px] font-semibold text-slate-900 mb-3">
          Pharmacy
        </Text>
        <View
          className="rounded-2xl p-4"
          style={{ borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" }}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center">
                <Store size={20} color="#2563eb" strokeWidth={1.75} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-slate-900">
                  {pharmacy?.name ?? "—"}
                </Text>
                <Text className="text-[13px] text-slate-500 mt-0.5">
                  {pharmacy?.address ?? "No address set"}
                </Text>
              </View>
            </View>
            {isOwner ? (
              <Pressable onPress={openEdit} hitSlop={10} className="p-1">
                <Pencil size={16} color="#94a3b8" />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      {/* Menu rows */}
      <View>
        <Text className="text-[13px] font-semibold text-slate-900 mb-3">
          Manage
        </Text>
        <View
          className="rounded-2xl overflow-hidden"
          style={{ borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" }}
        >
          {canManageStaff ? (
            <MenuRow
              icon={Users}
              label="Staff Management"
              subtitle="Add, edit, or deactivate staff"
              onPress={() => router.push("/staff-management")}
              bordered
            />
          ) : null}
          {isOwner ? (
            <MenuRow
              icon={CreditCard}
              label="Subscription"
              subtitle={pharmacy?.subscriptionStatus ?? "—"}
              onPress={() => router.navigate("subscription")}
            />
          ) : null}
        </View>
      </View>

      {/* Edit pharmacy modal */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-6 gap-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-slate-900">
                Edit Pharmacy
              </Text>
              <Pressable onPress={() => setEditVisible(false)}>
                <X size={22} color="#64748b" />
              </Pressable>
            </View>

            <TextInput
              placeholder="Pharmacy name"
              value={form.name}
              onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholderTextColor="#94a3b8"
              className="px-4 py-3.5 rounded-2xl text-[15px] text-slate-900"
              style={{ borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" }}
            />
            <TextInput
              placeholder="Address"
              value={form.address}
              onChangeText={(v) => setForm((p) => ({ ...p, address: v }))}
              placeholderTextColor="#94a3b8"
              className="px-4 py-3.5 rounded-2xl text-[15px] text-slate-900"
              style={{ borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" }}
            />

            <Pressable
              onPress={handleSave}
              disabled={updatePharmacy.isPending}
              className="rounded-2xl py-4 items-center"
              style={{
                backgroundColor: "#2563eb",
                opacity: updatePharmacy.isPending ? 0.6 : 1,
              }}
            >
              <Text className="text-white font-semibold text-[15px]">
                {updatePharmacy.isPending ? "Saving..." : "Save Changes"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function MenuRow({ icon: Icon, label, subtitle, onPress, bordered }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-4 py-4"
      style={
        bordered
          ? { borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" }
          : undefined
      }
    >
      <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
        <Icon size={18} color="#2563eb" strokeWidth={1.75} />
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-medium text-slate-900">{label}</Text>
        {subtitle ? (
          <Text className="text-[12px] text-slate-500 mt-0.5">{subtitle}</Text>
        ) : null}
      </View>
      <ChevronRight size={16} color="#94a3b8" />
    </Pressable>
  );
}
