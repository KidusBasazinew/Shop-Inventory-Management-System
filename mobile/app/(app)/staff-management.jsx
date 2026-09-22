import { useState } from "react";
/* Temporarily disabled until the staff hooks are restored.
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { Plus, X, UserX } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
} from "../../hooks/useUsers";
*/
import StaffCard from "../../components/staff/StaffCard";

const STAFF_ROLES = ["MANAGER", "CASHIER"];
const EMPTY_FORM = { fullName: "", phone: "", password: "", role: "CASHIER" };

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
      fullName: staffUser.fullName ?? "",
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
          payload: { fullName: form.fullName, role: form.role },
        });
      } else {
        if (!form.fullName || !form.phone || !form.password) {
          Alert.alert(
            "Missing fields",
            "Name, phone, and password are required",
          );
          return;
        }
        await createMutation.mutateAsync(form);
      }
      setModalVisible(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (e) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? "Failed to save staff member",
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
      `Deactivate ${staffUser.fullName}? Their access will be revoked immediately.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              await deactivateMutation.mutateAsync(staffUser.id);
            } catch (e) {
              Alert.alert(
                "Error",
                e?.response?.data?.message ?? "Failed to deactivate",
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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center px-6 bg-white">
        <Text className="text-red-500 text-center mb-4">
          Failed to load staff
        </Text>
        <Pressable
          onPress={() => refetch()}
          className="px-4 py-2 rounded-full"
          style={{ backgroundColor: "#2563eb" }}
        >
          <Text className="text-white font-semibold">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{ headerShown: true, title: "Staff Management" }}
      />

      <FlatList
        data={users ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 10 }}
        refreshing={isRefetching}
        onRefresh={refetch}
        renderItem={({ item }) => (
          <FlatList
            data={users ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, gap: 12 }}
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
        )}
      />

      {isOwner ? (
        <Pressable
          onPress={openCreate}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center"
          style={{
            backgroundColor: "#2563eb",
            elevation: 4,
            shadowColor: "#2563eb",
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Plus size={26} color="white" />
        </Pressable>
      ) : null}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/40 justify-end"
        >
          <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[85%]">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-slate-900">
                {editingId ? "Edit Staff" : "New Staff Member"}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={22} color="#64748b" />
              </Pressable>
            </View>

            <TextInput
              placeholder="Full name"
              value={form.fullName}
              onChangeText={(v) => setForm((p) => ({ ...p, fullName: v }))}
              placeholderTextColor="#94a3b8"
              className="px-4 py-3.5 rounded-2xl text-[15px] text-slate-900"
              style={{ borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" }}
            />

            {!editingId ? (
              <>
                <TextInput
                  placeholder="Phone (e.g. 0911223344)"
                  value={form.phone}
                  onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
                  keyboardType="phone-pad"
                  placeholderTextColor="#94a3b8"
                  className="px-4 py-3.5 rounded-2xl text-[15px] text-slate-900"
                  style={{ borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" }}
                />
                <TextInput
                  placeholder="Password"
                  value={form.password}
                  onChangeText={(v) => setForm((p) => ({ ...p, password: v }))}
                  secureTextEntry
                  placeholderTextColor="#94a3b8"
                  className="px-4 py-3.5 rounded-2xl text-[15px] text-slate-900"
                  style={{ borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" }}
                />
              </>
            ) : (
              <Text className="text-xs text-slate-500">
                Phone: {form.phone} (cannot be changed here)
              </Text>
            )}

            <View>
              <Text className="text-xs font-medium text-slate-500 mb-2">
                Role
              </Text>
              <View className="flex-row gap-2">
                {STAFF_ROLES.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setForm((p) => ({ ...p, role: r }))}
                    className="flex-1 py-3 rounded-2xl items-center"
                    style={{
                      backgroundColor:
                        form.role === r ? "#2563eb" : "transparent",
                      borderWidth: 1,
                      borderColor:
                        form.role === r ? "#2563eb" : "rgba(0,0,0,0.08)",
                    }}
                  >
                    <Text
                      className={`text-sm font-medium ${form.role === r ? "text-white" : "text-slate-500"}`}
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
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: "#2563eb", opacity: saving ? 0.6 : 1 }}
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
