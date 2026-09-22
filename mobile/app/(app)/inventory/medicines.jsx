import { useState } from "react";
import { router } from "expo-router";
/* Temporarily disabled until the inventory hooks are restored.
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Plus, X, PillBottle } from "lucide-react-native";
import {
  useMedicines,
  useCreateMedicine,
  useUpdateMedicine,
  useDeleteMedicine,
} from "../../../hooks/useMedicines";
*/
import SearchBar from "../../../components/common/SearchBar";
import EmptyState from "../../../components/common/EmptyState";
import FormField from "../../../components/common/FormField";
import UnitPicker from "../../../components/medicines/UnitPicker";
import MedicineCard from "../../../components/medicines/MedicineCard";
import FAB from "../../../components/common/FAB";

const UNITS = [
  "TABLET",
  "CAPSULE",
  "BOTTLE",
  "BOX",
  "VIAL",
  "TUBE",
  "SACHET",
  "SYRUP",
  "OTHER",
];

const EMPTY_FORM = {
  name: "",
  genericName: "",
  barcode: "",
  unit: "TABLET",
  reorderLevel: "10",
};

export default function Medicines() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch, isRefetching } = useMedicines({
    search,
  });
  const createMutation = useCreateMedicine();
  const updateMutation = useUpdateMedicine();
  const deleteMutation = useDeleteMedicine();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const medicines = data?.medicines ?? [];

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalVisible(true);
  };

  const openEdit = (medicine) => {
    setForm({
      name: medicine.name ?? "",
      genericName: medicine.genericName ?? "",
      barcode: medicine.barcode ?? "",
      unit: medicine.unit ?? "TABLET",
      reorderLevel: String(medicine.reorderLevel ?? 10),
    });
    setEditingId(medicine.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      Alert.alert("Missing field", "Name is required");
      return;
    }

    const payload = {
      name: form.name,
      genericName: form.genericName || undefined,
      barcode: form.barcode || undefined,
      unit: form.unit,
      reorderLevel: Number(form.reorderLevel) || 0,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setModalVisible(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (e) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ?? "Failed to save medicine",
      );
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      "Deactivate medicine",
      `Remove "${name}" from active inventory?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
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
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#004ac6" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center px-6 bg-background">
        <Text className="text-error text-center mb-4">
          Failed to load medicines
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
      <View className="px-4 pt-4 pb-3">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, generic, or barcode..."
        />
      </View>

      <FlatList
        data={medicines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingTop: 4,
          paddingBottom: 100,
          gap: 8,
          flexGrow: 1,
        }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon={PillBottle}
            title="No medicines found"
            description={
              search
                ? "Try a different search term."
                : "Add your first medicine to get started."
            }
          />
        }
        renderItem={({ item }) => (
          <MedicineCard
            medicine={item}
            onPress={() => openEdit(item)}
            onDelete={() => handleDelete(item.id, item.name)}
          />
        )}
      />

      <FAB icon={Plus} onPress={openCreate} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/40 justify-end"
        >
          <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[85%]">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-on-surface">
                {editingId ? "Edit Medicine" : "New Medicine"}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={22} color="#434655" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-4 pb-2">
                <FormField
                  label="Name"
                  required
                  placeholder="e.g. Amoxicillin 500mg"
                  value={form.name}
                  onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                />
                <FormField
                  label="Generic name"
                  placeholder="e.g. Amoxicillin"
                  value={form.genericName}
                  onChangeText={(v) =>
                    setForm((p) => ({ ...p, genericName: v }))
                  }
                />
                <FormField
                  label="Barcode"
                  placeholder="e.g. 8901030812347"
                  value={form.barcode}
                  onChangeText={(v) => setForm((p) => ({ ...p, barcode: v }))}
                />
                <FormField
                  label="Reorder level"
                  placeholder="10"
                  value={form.reorderLevel}
                  onChangeText={(v) =>
                    setForm((p) => ({ ...p, reorderLevel: v }))
                  }
                  keyboardType="numeric"
                />

                <UnitPicker
                  units={UNITS}
                  value={form.unit}
                  onChange={(u) => setForm((p) => ({ ...p, unit: u }))}
                />

                {editingId ? (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/medicine-batches",
                        params: {
                          medicineId: editingId,
                          medicineName: form.name,
                        },
                      })
                    }
                    className="border border-primary rounded-xl py-3 items-center"
                  >
                    <Text className="text-primary font-semibold">
                      View Batches
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </ScrollView>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="bg-primary rounded-xl py-4 items-center"
              style={{ opacity: saving ? 0.6 : 1 }}
            >
              <Text className="text-white font-semibold">
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Medicine"
                    : "Save Medicine"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
