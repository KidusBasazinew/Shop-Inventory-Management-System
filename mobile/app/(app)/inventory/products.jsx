import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  Plus,
  X,
  Package,
  PackagePlus,
  PackageMinus,
  RotateCcw,
  ChevronDown,
  Check,
  UserPlus,
  Camera,
  ImagePlus,
  Trash2,
} from "lucide-react-native";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeactivateProduct,
  useAddStock,
  useRemoveStock,
  useAdjustStock,
  useUploadProductPhoto,
} from "../../../hooks/useProducts";
import { useSuppliers, useCreateSupplier } from "../../../hooks/useSuppliers";
import SearchBar from "../../../components/common/SearchBar";
import EmptyState from "../../../components/common/EmptyState";
import FormField from "../../../components/common/FormField";
import DateField from "../../../components/common/DateField";
import UnitPicker from "../../../components/medicines/UnitPicker";
import ProductCard from "../../../components/inventory/ProductCard";
import {
  toBaseQuantity,
  fromBaseQuantity,
  formatQuantity,
} from "../../../lib/unitConversion";
import Pagination, {
  usePageCount,
} from "../../../components/common/Pagination";
import FAB from "../../../components/common/FAB";
import SheetModal from "../../../components/common/SheetModal";
import { playSuccess, playError } from "../../../lib/feedback";

const UNIT_TYPES = ["PIECE", "CARTON", "KG", "LITER"];

const EMPTY_FORM = {
  name: "",
  category: "",
  unitType: "PIECE",
  unitsPerPackage: "",
  buyingPrice: "",
  sellingPrice: "",
  minQuantityAlert: "10",
  quantity: "0",
  supplierId: "",
};

const STOCK_ACTIONS = [
  { key: "add", label: "Add Stock", icon: PackagePlus },
  { key: "remove", label: "Remove Stock", icon: PackageMinus },
  { key: "adjust", label: "Set Exact Count", icon: RotateCcw },
];

const PAGE_SIZE = 20;

export default function Products() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [supplierPickerVisible, setSupplierPickerVisible] = useState(false);
  const [newSupplierMode, setNewSupplierMode] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const { data, isLoading, isError, refetch, isRefetching } = useProducts({
    search,
    page,
    limit: PAGE_SIZE,
  });
  const { data: supplierData } = useSuppliers({ limit: 100 });
  const suppliers = supplierData?.items ?? [];
  const createSupplier = useCreateSupplier();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deactivateMutation = useDeactivateProduct();
  const addStockMutation = useAddStock();
  const removeStockMutation = useRemoveStock();
  const adjustStockMutation = useAdjustStock();
  const uploadPhotoMutation = useUploadProductPhoto();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expiryDate, setExpiryDate] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  // Photo picked in this session (not yet uploaded) + the existing saved one
  const [photo, setPhoto] = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);

  const [stockTarget, setStockTarget] = useState(null);
  const [stockAction, setStockAction] = useState("add");
  const [stockAmount, setStockAmount] = useState("");
  const [stockNote, setStockNote] = useState("");

  const products = data?.items ?? [];

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setExpiryDate(null);
    setEditingId(null);
    setPhoto(null);
    setExistingPhotoUrl(null);
    setRemoveExistingPhoto(false);
    setModalVisible(true);
  };

  const openEdit = (product) => {
    setForm({
      name: product.name ?? "",
      category: product.category ?? "",
      unitType: product.unitType ?? "PIECE",
      unitsPerPackage: product.unitsPerPackage
        ? String(product.unitsPerPackage)
        : "",
      buyingPrice: String(product.buyingPrice ?? ""),
      sellingPrice: String(product.sellingPrice ?? ""),
      minQuantityAlert: String(
        fromBaseQuantity(
          product.minQuantityAlert ?? 0,
          product.unitType,
          product.unitsPerPackage,
        ),
      ),
      quantity: String(product.quantity ?? 0),
      supplierId: product.preferredSupplierId ?? "",
    });
    setExpiryDate(product.expiryDate ? new Date(product.expiryDate) : null);
    setEditingId(product.id);
    setPhoto(null);
    setExistingPhotoUrl(product.photoUrl ?? null);
    setRemoveExistingPhoto(false);
    setModalVisible(true);
  };

  // Pick from gallery or camera. `quality` + a 1:1 crop keep the upload
  // small; the server then resizes and compresses it before storage.
  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo access so you can attach a product photo.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.length) {
      setPhoto(result.assets[0]);
      setRemoveExistingPhoto(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Allow camera access to photograph the product.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.length) {
      setPhoto(result.assets[0]);
      setRemoveExistingPhoto(false);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setRemoveExistingPhoto(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.buyingPrice || !form.sellingPrice) {
      Alert.alert(
        "Missing fields",
        "Name, buying price, and selling price are required",
      );
      return;
    }

    const unitsPerPackage = form.unitsPerPackage
      ? Number(form.unitsPerPackage)
      : undefined;
    const basePayload = {
      name: form.name,
      category: form.category || undefined,
      unitType: form.unitType,
      unitsPerPackage,
      buyingPrice: Number(form.buyingPrice),
      sellingPrice: Number(form.sellingPrice),
      minQuantityAlert: toBaseQuantity(
        form.minQuantityAlert,
        form.unitType,
        unitsPerPackage,
      ),
      expiryDate: expiryDate
        ? expiryDate.toISOString().split("T")[0]
        : undefined,
      supplierId: form.supplierId || undefined,
    };

    try {
      let savedProduct = null;
      if (editingId) {
        savedProduct = await updateMutation.mutateAsync({
          id: editingId,
          payload: {
            ...basePayload,
            // Explicit null clears the photo (server deletes the asset).
            ...(removeExistingPhoto && !photo ? { photoUrl: null } : {}),
          },
        });
      } else {
        savedProduct = await createMutation.mutateAsync({
          ...basePayload,
          quantity: toBaseQuantity(
            form.quantity,
            form.unitType,
            unitsPerPackage,
          ),
        });
      }

      // The photo is a separate multipart request once the product exists.
      const productId = editingId ?? savedProduct?.id;
      if (photo && productId) {
        try {
          await uploadPhotoMutation.mutateAsync({
            id: productId,
            image: photo,
          });
        } catch (uploadError) {
          Alert.alert(
            "Photo upload failed",
            uploadError?.response?.data?.error ??
              "The product was saved, but its photo could not be uploaded. Try again from Edit Product.",
          );
        }
      }

      playSuccess();
      setModalVisible(false);
      setForm(EMPTY_FORM);
      setPhoto(null);
      setExistingPhotoUrl(null);
      setRemoveExistingPhoto(false);
      setEditingId(null);
    } catch (e) {
      playError();
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to save product",
      );
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierForm.name) {
      Alert.alert("Missing name", "Enter the supplier's name");
      return;
    }
    try {
      const supplier = await createSupplier.mutateAsync(newSupplierForm);
      setForm((p) => ({ ...p, supplierId: supplier.id }));
      setNewSupplierMode(false);
      setNewSupplierForm({ name: "", phone: "", address: "" });
      setSupplierPickerVisible(false);
      playSuccess();
    } catch (e) {
      playError();
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to add supplier",
      );
    }
  };

  const handleDeactivate = (id, name) => {
    Alert.alert(
      "Deactivate product",
      `Remove "${name}" from active inventory?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              await deactivateMutation.mutateAsync(id);
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

  const handleStockSubmit = async () => {
    const typedAmount = Number(stockAmount);
    if (!typedAmount || typedAmount <= 0) {
      Alert.alert("Invalid", "Enter a positive amount");
      return;
    }
    const amount = toBaseQuantity(
      typedAmount,
      stockTarget.unitType,
      stockTarget.unitsPerPackage,
    );
    try {
      if (stockAction === "add") {
        await addStockMutation.mutateAsync({
          id: stockTarget.id,
          payload: { quantity: amount, note: stockNote || undefined },
        });
      } else if (stockAction === "remove") {
        await removeStockMutation.mutateAsync({
          id: stockTarget.id,
          payload: { quantity: amount, note: stockNote || undefined },
        });
      } else {
        await adjustStockMutation.mutateAsync({
          id: stockTarget.id,
          payload: { newQuantity: amount, note: stockNote || undefined },
        });
      }
      playSuccess();
      setStockTarget(null);
      setStockAmount("");
      setStockNote("");
      setStockAction("add");
    } catch (e) {
      playError();
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to update stock",
      );
    }
  };

  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadPhotoMutation.isPending;
  const photoPreviewUri =
    photo?.uri ?? (removeExistingPhoto ? null : existingPhotoUrl);

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
          Failed to load products
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
          onChangeText={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search products..."
        />
      </View>

      <FlatList
        data={products}
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
            icon={Package}
            title="No products found"
            description={
              search
                ? "Try a different search term."
                : "Add your first product to get started."
            }
          />
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => openEdit(item)}
            onDeactivate={() => handleDeactivate(item.id, item.name)}
          />
        )}
      />

      <Pagination
        page={page}
        totalPages={usePageCount(data?.total, PAGE_SIZE)}
        onPageChange={setPage}
      />

      <FAB icon={Plus} onPress={openCreate} />

      {/* Create / Edit Product Modal */}
      <SheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        snapPoints={["60%", "94%"]}
        initialIndex={1}
      >
        <View style={{ flexGrow: 1, padding: 24, gap: 16, paddingBottom: 100 }}>
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-on-surface">
              {editingId ? "Edit Product" : "New Product"}
            </Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <X size={22} color="#434655" />
            </Pressable>
          </View>

          {/* Product photo — gallery or camera. Auto resized/compressed
              server-side, so a large camera photo stays tiny in storage. */}
          <View className="items-center gap-3">
            {photoPreviewUri ? (
              <Image
                source={{ uri: photoPreviewUri }}
                className="w-28 h-28 rounded-2xl border border-outline-variant/30"
                resizeMode="cover"
              />
            ) : (
              <View className="w-28 h-28 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/50 items-center justify-center">
                <ImagePlus size={28} color="#737686" />
              </View>
            )}

            <View className="flex-row gap-2 justify-center">
              <Pressable
                onPress={pickPhoto}
                className="flex-row items-center gap-1.5 border border-outline-variant/40 rounded-xl px-3 py-2"
              >
                <ImagePlus size={15} color="#004ac6" />
                <Text className="text-xs font-semibold text-primary">
                  {photoPreviewUri ? "Change" : "Choose photo"}
                </Text>
              </Pressable>

              {Platform.OS !== "web" ? (
                <Pressable
                  onPress={takePhoto}
                  className="flex-row items-center gap-1.5 border border-outline-variant/40 rounded-xl px-3 py-2"
                >
                  <Camera size={15} color="#004ac6" />
                  <Text className="text-xs font-semibold text-primary">
                    Camera
                  </Text>
                </Pressable>
              ) : null}

              {photoPreviewUri ? (
                <Pressable
                  onPress={removePhoto}
                  className="flex-row items-center gap-1.5 border border-error/30 rounded-xl px-3 py-2"
                >
                  <Trash2 size={15} color="#BA1A1A" />
                  <Text className="text-xs font-semibold text-error">
                    Remove
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <Text className="text-[11px] text-on-surface-variant text-center">
              Photos are resized and compressed automatically to save storage.
            </Text>
          </View>

          <View className="gap-4 pb-2">
            <FormField
              label="Name"
              required
              placeholder="e.g. Cooking Oil 1L"
              value={form.name}
              onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
            />
            <FormField
              label="Category"
              placeholder="e.g. Cooking Oil"
              value={form.category}
              onChangeText={(v) => setForm((p) => ({ ...p, category: v }))}
            />
            <UnitPicker
              units={UNIT_TYPES}
              value={form.unitType}
              onChange={(u) => setForm((p) => ({ ...p, unitType: u }))}
              label="Unit type"
            />
            <FormField
              label="Units per package"
              placeholder="e.g. 24 (1 carton = 24 pieces)"
              value={form.unitsPerPackage}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, unitsPerPackage: v }))
              }
              keyboardType="numeric"
            />
            <View>
              <Text className="text-xs font-medium text-on-surface-variant mb-2">
                Preferred Supplier
              </Text>
              <Pressable
                onPress={() => setSupplierPickerVisible(true)}
                className="border border-outline-variant/40 rounded-xl px-4 py-3 flex-row items-center justify-between"
              >
                <Text
                  className={`flex-1 ${form.supplierId ? "text-on-surface" : "text-[#737686]"}`}
                  numberOfLines={1}
                >
                  {suppliers.find((s) => s.id === form.supplierId)?.name ??
                    "None selected"}
                </Text>
                <ChevronDown size={18} color="#737686" />
              </Pressable>
            </View>
            <FormField
              label="Buying price"
              required
              placeholder="0.00"
              value={form.buyingPrice}
              onChangeText={(v) => setForm((p) => ({ ...p, buyingPrice: v }))}
              keyboardType="decimal-pad"
            />
            <FormField
              label="Selling price"
              required
              placeholder="0.00"
              value={form.sellingPrice}
              onChangeText={(v) => setForm((p) => ({ ...p, sellingPrice: v }))}
              keyboardType="decimal-pad"
            />
            <FormField
              label={
                form.unitType === "CARTON" && form.unitsPerPackage
                  ? `Low stock alert (in cartons of ${form.unitsPerPackage})`
                  : "Low stock alert threshold"
              }
              placeholder="10"
              value={form.minQuantityAlert}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, minQuantityAlert: v }))
              }
              keyboardType="numeric"
            />
            {!editingId ? (
              <FormField
                label={
                  form.unitType === "CARTON" && form.unitsPerPackage
                    ? `Starting quantity (in cartons of ${form.unitsPerPackage})`
                    : "Starting quantity"
                }
                placeholder="0"
                value={form.quantity}
                onChangeText={(v) => setForm((p) => ({ ...p, quantity: v }))}
                keyboardType="numeric"
              />
            ) : null}
            <DateField
              label="Expiry date (optional)"
              value={expiryDate}
              onChange={setExpiryDate}
            />

            {editingId ? (
              <Pressable
                onPress={() => {
                  const product = products.find((p) => p.id === editingId);
                  setModalVisible(false);
                  setStockTarget(product);
                }}
                className="border border-primary rounded-xl py-3 items-center mt-2"
              >
                <Text className="text-primary font-semibold">Manage Stock</Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="bg-primary rounded-xl py-4 items-center mt-2"
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            <Text className="text-white font-semibold">
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Product"
                  : "Save Product"}
            </Text>
          </Pressable>
        </View>
      </SheetModal>

      {/* Stock Adjustment Modal */}
      <SheetModal
        visible={!!stockTarget}
        onClose={() => setStockTarget(null)}
        snapPoints={["50%", "80%"]}
        initialIndex={0}
      >
        <View style={{ flexGrow: 1, padding: 24, gap: 16, paddingBottom: 80 }}>
          <Text className="text-lg font-bold text-on-surface">
            Manage Stock — {stockTarget?.name}
          </Text>
          <Text className="text-xs text-on-surface-variant">
            Current quantity:{" "}
            {stockTarget
              ? formatQuantity(
                  stockTarget.quantity,
                  stockTarget.unitType,
                  stockTarget.unitsPerPackage,
                )
              : ""}
          </Text>

          <UnitPicker
            units={STOCK_ACTIONS.map((a) => a.key)}
            value={stockAction}
            onChange={setStockAction}
            label="Action"
          />

          <FormField
            label={
              stockTarget?.unitType === "CARTON" && stockTarget?.unitsPerPackage
                ? `${stockAction === "adjust" ? "New exact quantity" : "Amount"} (in cartons of ${stockTarget.unitsPerPackage})`
                : stockAction === "adjust"
                  ? "New exact quantity"
                  : "Amount"
            }
            placeholder={stockAction === "adjust" ? "e.g. 42" : "e.g. 10"}
            value={stockAmount}
            onChangeText={setStockAmount}
            keyboardType="numeric"
          />

          <FormField
            label="Note"
            placeholder="optional"
            value={stockNote}
            onChangeText={setStockNote}
          />

          <View className="flex-row gap-3 pt-2">
            <Pressable
              onPress={() => {
                setStockTarget(null);
                setStockAmount("");
                setStockNote("");
              }}
              className="flex-1 border border-outline-variant/40 rounded-xl py-3 items-center"
            >
              <Text className="text-on-surface-variant font-medium">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleStockSubmit}
              disabled={
                addStockMutation.isPending ||
                removeStockMutation.isPending ||
                adjustStockMutation.isPending
              }
              className="flex-1 bg-primary rounded-xl py-3 items-center"
            >
              <Text className="text-white font-semibold">Confirm</Text>
            </Pressable>
          </View>
        </View>
      </SheetModal>

      {/* Preferred Supplier Picker Modal */}
      <SheetModal
        visible={supplierPickerVisible}
        onClose={() => {
          setSupplierPickerVisible(false);
          setNewSupplierMode(false);
        }}
        snapPoints={["55%", "90%"]}
        initialIndex={1}
      >
        <View style={{ flexGrow: 1, padding: 24, gap: 16, paddingBottom: 80 }}>
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-on-surface">
              {newSupplierMode ? "New Supplier" : "Preferred Supplier"}
            </Text>
            <Pressable
              onPress={() => {
                setSupplierPickerVisible(false);
                setNewSupplierMode(false);
              }}
            >
              <X size={22} color="#434655" />
            </Pressable>
          </View>

          {newSupplierMode ? (
            <View className="gap-3">
              <FormField
                label="Supplier name"
                required
                placeholder="e.g. ABC Trading"
                value={newSupplierForm.name}
                onChangeText={(v) =>
                  setNewSupplierForm((p) => ({ ...p, name: v }))
                }
              />
              <FormField
                label="Phone"
                placeholder="0911223344"
                value={newSupplierForm.phone}
                onChangeText={(v) =>
                  setNewSupplierForm((p) => ({ ...p, phone: v }))
                }
                keyboardType="phone-pad"
              />
              <FormField
                label="Address"
                placeholder="Optional"
                value={newSupplierForm.address}
                onChangeText={(v) =>
                  setNewSupplierForm((p) => ({ ...p, address: v }))
                }
              />

              <View className="flex-row gap-3 mt-1">
                <Pressable
                  onPress={() => setNewSupplierMode(false)}
                  className="flex-1 border border-outline-variant/40 rounded-xl py-3 items-center"
                >
                  <Text className="text-on-surface-variant font-semibold text-xs">
                    Back
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleCreateSupplier}
                  disabled={createSupplier.isPending}
                  className="flex-1 bg-primary rounded-xl py-3 items-center"
                  style={{ opacity: createSupplier.isPending ? 0.6 : 1 }}
                >
                  <Text className="text-white font-semibold text-xs">
                    {createSupplier.isPending ? "Saving..." : "Add & Select"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => setNewSupplierMode(true)}
                className="flex-row items-center justify-center gap-2 border border-dashed border-primary/50 rounded-xl py-3"
              >
                <UserPlus size={16} color="#004ac6" />
                <Text className="text-primary font-semibold text-sm">
                  Add New Supplier
                </Text>
              </Pressable>

              <View className="gap-2">
                <Pressable
                  onPress={() => {
                    setForm((p) => ({ ...p, supplierId: "" }));
                    setSupplierPickerVisible(false);
                  }}
                  className={`p-4 rounded-xl border flex-row items-center justify-between ${
                    !form.supplierId
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/30 bg-surface-container-low"
                  }`}
                >
                  <Text className="font-semibold text-on-surface-variant italic">
                    None
                  </Text>
                  {!form.supplierId ? (
                    <Check size={18} color="#004ac6" />
                  ) : null}
                </Pressable>

                {suppliers.map((supplier) => {
                  const isSelected = supplier.id === form.supplierId;
                  return (
                    <Pressable
                      key={supplier.id}
                      onPress={() => {
                        setForm((p) => ({ ...p, supplierId: supplier.id }));
                        setSupplierPickerVisible(false);
                      }}
                      className={`p-4 rounded-xl border flex-row items-center justify-between ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-outline-variant/30 bg-surface-container-low"
                      }`}
                    >
                      <Text className="font-semibold text-on-surface">
                        {supplier.name}
                      </Text>
                      {isSelected ? <Check size={18} color="#004ac6" /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </SheetModal>
    </View>
  );
}
