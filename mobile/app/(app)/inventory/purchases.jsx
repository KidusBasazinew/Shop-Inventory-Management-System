import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Stack } from "expo-router";
import { ShoppingBag, X, Plus, ChevronDown, Check } from "lucide-react-native";
// Temporarily disabled: inventory hooks are not available in this checkout.
// import { useMedicines } from "../../../hooks/useMedicines";
// import { useSuppliers } from "../../../hooks/useSuppliers";
// import { useBatches, useCreateBatch } from "../../../hooks/useBatches";
import SearchBar from "../../../components/common/SearchBar";
import EmptyState from "../../../components/common/EmptyState";
import FormField from "../../../components/common/FormField";
import DateField from "../../../components/common/DateField";
import PurchaseCard from "../../../components/purchase/PurchaseCard";
import FAB from "../../../components/common/FAB";

const FILTER_TAGS = [
  { id: "ALL", label: "All Purchases" },
  { id: "NEAR_EXPIRY", label: "Near Expiry" },
  { id: "HIGH_VALUE", label: "High Investment" },
];

const EMPTY_PURCHASE_FORM = {
  medicineId: "",
  batchNumber: "",
  quantity: "",
  buyPrice: "",
  sellPrice: "",
  supplierId: "",
};

export default function PurchasesScreen() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [modalVisible, setModalVisible] = useState(false);
  const [medicinePickerVisible, setMedicinePickerVisible] = useState(false);
  const [supplierPickerVisible, setSupplierPickerVisible] = useState(false);

  const [form, setForm] = useState(EMPTY_PURCHASE_FORM);
  const [expiryDate, setExpiryDate] = useState(null);

  const { data: batchesData } = useBatches({ search });

  const allBatches = useMemo(
    () =>
      (batchesData?.batches ?? []).map((b) => ({
        ...b,
        medicineName: b.medicine?.name,
      })),
    [batchesData],
  );

  const { data: medicinesData, isLoading: medLoading } = useMedicines({
    limit: 100,
  });
  const { data: supplierData } = useSuppliers({ limit: 50 });

  const medicines = medicinesData?.medicines ?? [];
  const suppliers = supplierData?.suppliers ?? [];

  // Pass active form medicineId dynamically
  const createBatchMutation = useCreateBatch(form.medicineId);

  // Financial Metrics
  const metrics = useMemo(() => {
    const totalSpend = allBatches.reduce(
      (sum, b) => sum + Number(b.buyPrice || 0) * Number(b.quantity || 0),
      0,
    );
    const totalUnits = allBatches.reduce(
      (sum, b) => sum + Number(b.quantity || 0),
      0,
    );
    const avgBuyPrice =
      allBatches.length > 0
        ? allBatches.reduce((sum, b) => sum + Number(b.buyPrice || 0), 0) /
          allBatches.length
        : 0;

    return { totalSpend, totalUnits, avgBuyPrice };
  }, [allBatches]);

  // Filtering Logic
  const filteredPurchases = useMemo(() => {
    const now = new Date();

    return allBatches.filter((item) => {
      const matchesSearch =
        !search ||
        item.medicineName?.toLowerCase().includes(search.toLowerCase()) ||
        item.batchNumber?.toLowerCase().includes(search.toLowerCase()) ||
        item.supplier?.name?.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === "NEAR_EXPIRY") {
        const expDate = new Date(item.expiryDate);
        const daysLeft = Math.ceil(
          (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysLeft <= 90;
      }

      if (activeFilter === "HIGH_VALUE") {
        const totalVal = Number(item.buyPrice) * Number(item.quantity);
        return totalVal >= 500;
      }

      return true;
    });
  }, [allBatches, search, activeFilter]);

  const selectedMedicine = medicines.find((m) => m.id === form.medicineId);
  const selectedSupplier = suppliers.find((s) => s.id === form.supplierId);
  if (medLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#004ac6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Procurement Hero Summary Banner */}
      <View className="bg-surface border-b border-outline-variant/30 px-4 pt-4 pb-3 shadow-xs">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2.5">
            <View className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center">
              <ShoppingBag size={20} color="#004ac6" />
            </View>
            <View>
              <Text className="text-xs uppercase tracking-wider font-bold text-primary">
                Procurement Overview
              </Text>
              <Text className="text-lg font-bold text-on-surface">
                Inventory Acquisitions
              </Text>
            </View>
          </View>
        </View>

        {/* Financial Metrics Row */}
        <View className="flex-row items-center justify-between bg-surface-container-low p-3 rounded-2xl border border-outline-variant/20 mb-3">
          <View className="flex-1">
            <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
              Total Spend
            </Text>
            <Text className="text-base font-extrabold text-on-surface mt-0.5">
              ETB{" "}
              {metrics.totalSpend.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>

          <View className="w-[1px] h-7 bg-outline-variant/30 mx-2" />

          <View className="flex-1">
            <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
              Total Acquired
            </Text>
            <Text className="text-base font-extrabold text-on-surface mt-0.5">
              {metrics.totalUnits}{" "}
              <Text className="text-xs font-normal">units</Text>
            </Text>
          </View>

          <View className="w-[1px] h-7 bg-outline-variant/30 mx-2" />

          <View className="flex-1">
            <Text className="text-[10px] uppercase font-bold text-on-surface-variant">
              Avg Cost/Batch
            </Text>
            <Text className="text-base font-extrabold text-primary mt-0.5">
              ETB {metrics.avgBuyPrice.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by medicine, lot # or supplier..."
        />

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8 }}
        >
          {FILTER_TAGS.map((tag) => {
            const isSelected = activeFilter === tag.id;
            return (
              <Pressable
                key={tag.id}
                onPress={() => setActiveFilter(tag.id)}
                className={`px-3 py-1.5 rounded-full border ETB {
                  isSelected
                    ? "bg-primary border-primary"
                    : "bg-surface-container-low border-outline-variant/40"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ETB {
                    isSelected ? "text-white" : "text-on-surface-variant"
                  }`}
                >
                  {tag.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Ledger List */}
      <FlatList
        data={filteredPurchases}
        keyExtractor={(item, index) => item.id ?? String(index)}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
          gap: 12,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <EmptyState
            icon={ShoppingBag}
            title="No Purchases Recorded"
            description="Log your inward stock purchases to track supplier costs, margins, and batch investment."
          />
        }
        renderItem={({ item }) => <PurchaseCard purchase={item} />}
      />
    </View>
  );
}
