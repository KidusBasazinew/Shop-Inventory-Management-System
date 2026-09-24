import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  Plus,
  X,
  Package,
  PackagePlus,
  PackageMinus,
  RotateCcw,
} from "lucide-react-native";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeactivateProduct,
  useAddStock,
  useRemoveStock,
  useAdjustStock,
} from "../../../hooks/useProducts";
import { useSuppliers } from "../../../hooks/useSuppliers";
import { ChevronDown, Check } from "lucide-react-native";
import SearchBar from "../../../components/common/SearchBar";
import EmptyState from "../../../components/common/EmptyState";
import FormField from "../../../components/common/FormField";
import DateField from "../../../components/common/DateField";
import UnitPicker from "../../../components/medicines/UnitPicker";
import ProductCard from "../../../components/inventory/ProductCard";
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
  const { data, isLoading, isError, refetch, isRefetching } = useProducts({
    search,
    page,
    limit: PAGE_SIZE,
  });
  const { data: supplierData } = useSuppliers({ limit: 100 });
  const suppliers = supplierData?.items ?? [];
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deactivateMutation = useDeactivateProduct();
  const addStockMutation = useAddStock();
  const removeStockMutation = useRemoveStock();
  const adjustStockMutation = useAdjustStock();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expiryDate, setExpiryDate] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [stockTarget, setStockTarget] = useState(null);
  const [stockAction, setStockAction] = useState("add");
  const [stockAmount, setStockAmount] = useState("");
  const [stockNote, setStockNote] = useState("");

  const products = data?.items ?? [];

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setExpiryDate(null);
    setEditingId(null);
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
      minQuantityAlert: String(product.minQuantityAlert ?? 0),
      quantity: String(product.quantity ?? 0),
      supplierId: product.preferredSupplierId ?? "",
    });
    setExpiryDate(product.expiryDate ? new Date(product.expiryDate) : null);
    setEditingId(product.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.buyingPrice || !form.sellingPrice) {
      Alert.alert(
        "Missing fields",
        "Name, buying price, and selling price are required",
      );
      return;
    }

    const basePayload = {
      name: form.name,
      category: form.category || undefined,
      unitType: form.unitType,
      unitsPerPackage: form.unitsPerPackage
        ? Number(form.unitsPerPackage)
        : undefined,
      buyingPrice: Number(form.buyingPrice),
      sellingPrice: Number(form.sellingPrice),
      minQuantityAlert: Number(form.minQuantityAlert) || 0,
      expiryDate: expiryDate
        ? expiryDate.toISOString().split("T")[0]
        : undefined,
      supplierId: form.supplierId || undefined,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          payload: basePayload,
        });
      } else {
        await createMutation.mutateAsync({
          ...basePayload,
          quantity: Number(form.quantity) || 0,
        });
      }
      playSuccess();
      setModalVisible(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (e) {
      playError();
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to save product",
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
    const amount = Number(stockAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid", "Enter a positive amount");
      return;
    }
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

      {/* Create / Edit modal */}
      <SheetModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <BottomSheetScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator
          contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 40 }}
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-on-surface">
              {editingId ? "Edit Product" : "New Product"}
            </Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <X size={22} color="#434655" />
            </Pressable>
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
              label="Low stock alert threshold"
              placeholder="10"
              value={form.minQuantityAlert}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, minQuantityAlert: v }))
              }
              keyboardType="numeric"
            />
            {!editingId ? (
              <FormField
                label="Starting quantity"
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
                className="border border-primary rounded-xl py-3 items-center"
              >
                <Text className="text-primary font-semibold">Manage Stock</Text>
              </Pressable>
            ) : null}
          </View>

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
                  ? "Update Product"
                  : "Save Product"}
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </SheetModal>

      {/* Stock adjustment modal */}
      <SheetModal visible={!!stockTarget} onClose={() => setStockTarget(null)}>
        <View className="p-6 gap-4">
          <Text className="text-lg font-bold text-on-surface">
            Manage Stock — {stockTarget?.name}
          </Text>
          <Text className="text-xs text-on-surface-variant">
            Current quantity: {stockTarget?.quantity}
          </Text>

          <UnitPicker
            units={STOCK_ACTIONS.map((a) => a.key)}
            value={stockAction}
            onChange={setStockAction}
            label="Action"
          />

          <FormField
            label={stockAction === "adjust" ? "New exact quantity" : "Amount"}
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

          <View className="flex-row gap-3">
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
      <SheetModal
        visible={supplierPickerVisible}
        onClose={() => setSupplierPickerVisible(false)}
      >
        <View className="p-6 gap-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-on-surface">
              Preferred Supplier
            </Text>
            <Pressable onPress={() => setSupplierPickerVisible(false)}>
              <X size={22} color="#434655" />
            </Pressable>
          </View>
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <View className="gap-2 pb-2">
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
                {!form.supplierId ? <Check size={18} color="#004ac6" /> : null}
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
          </BottomSheetScrollView>
        </View>
      </SheetModal>
    </View>
  );
}
