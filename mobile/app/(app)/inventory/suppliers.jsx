import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { X, Truck, Building2, Store } from "lucide-react-native";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "../../../hooks/useSuppliers";
import SearchBar from "../../../components/common/SearchBar";
import EmptyState from "../../../components/common/EmptyState";
import FormField from "../../../components/common/FormField";
import SupplierCard from "../../../components/suppliers/SupplierCard";
import FAB from "../../../components/common/FAB";

const EMPTY_FORM = { name: "", phone: "", address: "" };

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch, isRefetching } = useSuppliers({
    search,
  });

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const suppliers = data?.suppliers ?? [];

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (supplier) => {
    setForm({
      name: supplier.name ?? "",
      phone: supplier.phone ?? "",
      address: supplier.address ?? "",
    });
    setEditingId(supplier.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      Alert.alert("Missing fields", "Name and phone are required");
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload: form });
      } else {
        await createMutation.mutateAsync(form);
      }
      setModalVisible(false);
      resetForm();
    } catch (e) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? "Failed to save supplier",
      );
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert("Delete supplier", `Remove "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(id);
          } catch (e) {
            Alert.alert(
              "Cannot delete",
              e?.response?.data?.message ?? "Failed to delete",
            );
          }
        },
      },
    ]);
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
          Failed to load suppliers
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
      {/* Network Overview Banner */}
      <View className="px-4 pt-4 pb-2 bg-surface border-b border-outline-variant/30">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2.5">
            <View className="w-10 h-10 rounded-2xl bg-primary/10 items-center justify-center border border-primary/20">
              <Store size={20} color="#004ac6" />
            </View>
            <View>
              <Text className="text-xs uppercase tracking-wider font-bold text-primary">
                Supply Network
              </Text>
              <Text className="text-lg font-bold text-on-surface">
                Wholesale Partners
              </Text>
            </View>
          </View>

          <View className="bg-surface-container-high px-3 py-1.5 rounded-full border border-outline-variant/30">
            <Text className="text-xs font-bold text-on-surface">
              {suppliers.length} Active{" "}
              {suppliers.length === 1 ? "Vendor" : "Vendors"}
            </Text>
          </View>
        </View>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search suppliers or locations..."
        />
      </View>

      <FlatList
        data={suppliers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingTop: 12,
          paddingBottom: 100,
          gap: 12,
          flexGrow: 1,
        }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon={Truck}
            title="No suppliers found"
            description={
              search
                ? "Try searching for another supplier name or city."
                : "Register your first wholesale vendor or agency to manage procurement."
            }
          />
        }
        renderItem={({ item }) => (
          <SupplierCard
            supplier={item}
            onPress={() => openEdit(item)}
            onDelete={() => handleDelete(item.id, item.name)}
          />
        )}
      />

      <FAB icon={Truck} onPress={openCreate} />

      {/* Create / Edit Supplier Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/40 justify-end"
        >
          <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[85%]">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <Building2 size={20} color="#004ac6" />
                <Text className="text-lg font-bold text-on-surface">
                  {editingId ? "Edit Vendor Profile" : "New Wholesale Supplier"}
                </Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={22} color="#434655" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-4 pb-2">
                <FormField
                  label="Supplier / Agency Name"
                  required
                  placeholder="e.g. EPHARM Pharmaceuticals Agency"
                  value={form.name}
                  onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                />
                <FormField
                  label="Contact Phone"
                  required
                  placeholder="e.g. 0115501235"
                  value={form.phone}
                  onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
                  keyboardType="phone-pad"
                />
                <FormField
                  label="Physical Depot / Address"
                  placeholder="e.g. Akaki Kality, Addis Ababa"
                  value={form.address}
                  onChangeText={(v) => setForm((p) => ({ ...p, address: v }))}
                />
              </View>
            </ScrollView>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="bg-primary rounded-xl py-4 items-center shadow-xs"
              style={{ opacity: saving ? 0.6 : 1 }}
            >
              <Text className="text-white font-semibold">
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Supplier"
                    : "Save Supplier Profile"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
