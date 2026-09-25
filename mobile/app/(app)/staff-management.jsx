import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { Plus, X } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
} from "../../hooks/useUsers";
import StaffCard from "../../components/staff/StaffCard";
import SheetModal from "../../components/common/SheetModal";
import { playSuccess, playError } from "../../lib/feedback";

const STAFF_ROLES = ["MANAGER", "CASHIER", "EMPLOYEE"];
const EMPTY_FORM = { name: "", phone: "", password: "", role: "CASHIER" };

export default function StaffManagement() {
  const { user } = useAuth();
  const isOwner = user?.role === "OWNER";

  const { data: users, isLoading, isError, refetch, isRefetching } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deactivateMutation = useDeactivateUser();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalVisible(true);
  };

  const openEdit = (staffUser) => {
    setForm({
      name: staffUser.name ?? "",
      phone: staffUser.phone ?? "",
      password: "",
      role: staffUser.role,
    });
    setEditingId(staffUser.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          payload: { name: form.name, role: form.role },
        });
      } else {
        if (!form.name || !form.phone || !form.password) {
          Alert.alert(
            "Missing fields",
            "Name, phone, and password are required",
          );
          return;
        }
        await createMutation.mutateAsync(form);
      }
      playSuccess();
      setModalVisible(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (e) {
      playError();
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to save staff member",
      );
    }
  };

  const handleDeactivate = (staffUser) => {
    if (staffUser.id === user.id) {
      Alert.alert("Not allowed", "You cannot deactivate your own account");
      return;
    }
    Alert.alert(
      "Deactivate staff",
      `Deactivate ${staffUser.name}? Their access will be revoked immediately.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              await deactivateMutation.mutateAsync(staffUser.id);
              playSuccess();
            } catch (e) {
              playError();
              Alert.alert(
                "Error",
                e?.response?.data?.error ?? "Failed to deactivate",
              );
            }
          },
        },
      ],
    );
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#004ac6" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center px-6 bg-background">
        <Text className="text-error text-center mb-4">
          Failed to load staff
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="bg-primary px-4 py-2 rounded-full"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{ headerShown: true, title: "Staff Management" }}
      />

      <FlatList
        data={users ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 100 }}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <StaffCard
            staff={item}
            isOwner={isOwner}
            onPress={() => openEdit(item)}
            onDeactivate={() => handleDeactivate(item)}
          />
        )}
      />

      {isOwner ? (
        <Pressable
          onPress={openCreate}
          className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg active:opacity-90"
        >
          <Plus size={26} color="white" />
        </Pressable>
      ) : null}

      <SheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        snapPoints={["55%", "90%"]}
        initialIndex={1}
      >
        <View style={{ flexGrow: 1, padding: 24, gap: 16, paddingBottom: 80 }}>
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-on-surface">
              {editingId ? "Edit Staff" : "New Staff Member"}
            </Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <X size={22} color="#434655" />
            </Pressable>
          </View>

          <BottomSheetTextInput
            placeholder="Full name"
            value={form.name}
            onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
            placeholderTextColor="#737686"
            className="border border-outline-variant/40 rounded-xl px-4 py-3.5 text-[15px] text-on-surface"
          />

          {!editingId ? (
            <>
              <BottomSheetTextInput
                placeholder="Phone (e.g. 0911223344)"
                value={form.phone}
                onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
                keyboardType="phone-pad"
                placeholderTextColor="#737686"
                className="border border-outline-variant/40 rounded-xl px-4 py-3.5 text-[15px] text-on-surface"
              />
              <BottomSheetTextInput
                placeholder="Password"
                value={form.password}
                onChangeText={(v) => setForm((p) => ({ ...p, password: v }))}
                secureTextEntry
                placeholderTextColor="#737686"
                className="border border-outline-variant/40 rounded-xl px-4 py-3.5 text-[15px] text-on-surface"
              />
            </>
          ) : (
            <Text className="text-xs text-on-surface-variant">
              Phone: {form.phone} (cannot be changed here)
            </Text>
          )}

          <View>
            <Text className="text-xs font-medium text-on-surface-variant mb-2">
              Role
            </Text>
            <View className="flex-row gap-2">
              {STAFF_ROLES.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setForm((p) => ({ ...p, role: r }))}
                  className={`flex-1 py-3 rounded-2xl items-center border ${
                    form.role === r
                      ? "bg-primary border-primary"
                      : "border-outline-variant/40"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${form.role === r ? "text-white" : "text-on-surface-variant"}`}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="bg-primary rounded-2xl py-4 items-center"
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            <Text className="text-white font-semibold">
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Staff"
                  : "Create Staff"}
            </Text>
          </Pressable>
        </View>
      </SheetModal>
    </View>
  );
}
