import React, { useState, useMemo } from "react";

import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import {
  Wallet,
  Plus,
  X,
  Trash2,
  Pencil,
  Receipt,
  Tag,
  Calendar,
  ChevronDown,
} from "lucide-react-native";
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "../../../hooks/useExpenses";

import SearchBar from "../../../components/common/SearchBar";
import EmptyState from "../../../components/common/EmptyState";
import FormField from "../../../components/common/FormField";
import DateField from "../../../components/common/DateField";
import FAB from "../../../components/common/FAB";
import { playSuccess, playError } from "../../../lib/feedback";

const CATEGORIES = [
  { id: "RENT", label: "Rent" },
  { id: "ELECTRICITY", label: "Electricity" },
  { id: "WATER", label: "Water" },
  { id: "SALARY", label: "Salary" },
  { id: "TRANSPORT", label: "Transport" },
  { id: "OTHER", label: "Other" },
];

const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

const EMPTY_FORM = { category: "", amount: "", description: "" };

export default function ExpensesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expenseDate, setExpenseDate] = useState(new Date());

  const { data, isLoading, refetch, isRefetching } = useExpenses({
    category: categoryFilter ?? undefined,
    limit: 100,
  });
  const expenses = data?.items ?? [];

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const selectedCategory = CATEGORIES.find((c) => c.id === form.category);

  // Client-side text filter across description and category
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    const query = searchQuery.toLowerCase();
    return expenses.filter((item) => {
      const catMatch = categoryLabel(item.category)
        .toLowerCase()
        .includes(query);
      const descMatch = item.description?.toLowerCase().includes(query);
      return catMatch || descMatch;
    });
  }, [expenses, searchQuery]);

  const handleRefresh = async () => {
    await refetch();
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setExpenseDate(new Date());
    setModalVisible(true);
  };

  const openEdit = (expense) => {
    setEditingId(expense.id);
    setForm({
      category: expense.category,
      amount: String(expense.amount),
      description: expense.description ?? "",
    });
    setExpenseDate(new Date(expense.date));
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.category || !form.amount) {
      Alert.alert("Missing fields", "Category and amount are required.");
      return;
    }

    const payload = {
      category: form.category,
      amount: Number(form.amount),
      description: form.description || undefined,
      date: expenseDate.toISOString(),
    };

    try {
      if (editingId) {
        await updateExpense.mutateAsync({ id: editingId, payload });
      } else {
        await createExpense.mutateAsync(payload);
      }
      playSuccess();
      setModalVisible(false);
    } catch (e) {
      playError();
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to save expense",
      );
    }
  };

  const handleDelete = (expense) => {
    Alert.alert(
      "Delete expense?",
      `Remove "${categoryLabel(expense.category)}" — ETB ${Number(
        expense.amount,
      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteExpense.mutate(expense.id, { onSuccess: playSuccess }),
        },
      ],
    );
  };

  const isSaving = createExpense.isPending || updateExpense.isPending;

  return (
    <View className="flex-1 bg-background">
      {/* Hero Summary Header */}
      <View className="bg-surface border-b border-outline-variant/30 px-4 pt-4 pb-3 shadow-sm">
        <View className="flex-row items-center justify-between mb-4 bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/20">
          <View className="flex-row items-center gap-3">
            <View className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center">
              <Wallet size={22} color="#004ac6" />
            </View>
            <View>
              <Text className="text-[11px] uppercase tracking-wider font-bold text-primary">
                30-Day Operating Cost
              </Text>
              <Text className="text-xl font-bold text-on-surface">
                ETB{" "}
                {(data?.totalAmount ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Search Input */}
        <View className="mb-3">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by category or description..."
          />
        </View>

        {/* Filter Chips Horizontal Slider */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingRight: 8 }}
        >
          <Pressable
            onPress={() => setCategoryFilter(null)}
            className={`px-3.5 py-1.5 rounded-full border active:opacity-70 ${
              categoryFilter === null
                ? "bg-primary border-primary"
                : "bg-surface-container-low border-outline-variant/40"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                categoryFilter === null
                  ? "text-white"
                  : "text-on-surface-variant"
              }`}
            >
              All Categories
            </Text>
          </Pressable>

          {CATEGORIES.map((c) => {
            const isSelected = categoryFilter === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategoryFilter(c.id)}
                className={`px-3.5 py-1.5 rounded-full border active:opacity-70 ${
                  isSelected
                    ? "bg-primary border-primary"
                    : "bg-surface-container-low border-outline-variant/40"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? "text-white" : "text-on-surface-variant"
                  }`}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Expense Feed */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#004ac6" />
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor="#004ac6"
            />
          }
          contentContainerStyle={{
            padding: 16,
            gap: 10,
            paddingBottom: 110,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <EmptyState
              icon={Receipt}
              title="No Expenses Logged"
              description={
                searchQuery
                  ? "No entries match your search criteria."
                  : "Track rent, utilities, salaries, and other operating costs here."
              }
            />
          }
          renderItem={({ item }) => (
            <View className="bg-surface p-4 rounded-2xl border border-outline-variant/30 flex-row items-center justify-between shadow-sm">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <View className="bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                    <Text className="font-bold text-primary text-[11px] uppercase">
                      {categoryLabel(item.category)}
                    </Text>
                  </View>
                </View>

                {item.description ? (
                  <Text
                    className="text-sm font-medium text-on-surface mt-0.5"
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                ) : null}

                <View className="flex-row items-center gap-1 mt-1.5">
                  <Calendar size={12} color="#737686" />
                  <Text className="text-xs font-medium text-on-surface-variant">
                    {new Date(item.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </View>

              <View className="items-end justify-between gap-3">
                <Text className="font-extrabold text-on-surface text-base">
                  ETB{" "}
                  {Number(item.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>

                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => openEdit(item)}
                    hitSlop={8}
                    className="p-2 rounded-xl bg-primary/10 active:opacity-70"
                  >
                    <Pencil size={15} color="#004ac6" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(item)}
                    hitSlop={8}
                    className="p-2 rounded-xl bg-error/10 active:opacity-70"
                  >
                    <Trash2 size={15} color="#BA1A1A" />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <FAB icon={Plus} onPress={openCreate} />

      {/* Main Form Drawer Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/40 justify-end"
        >
          <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[85%]">
            <View className="flex-row justify-between items-center pb-2 border-b border-outline-variant/20">
              <View className="flex-row items-center gap-2">
                <Receipt size={20} color="#004ac6" />
                <Text className="text-lg font-bold text-on-surface">
                  {editingId ? "Edit Expense Entry" : "Log New Expense"}
                </Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                className="p-1 rounded-full bg-surface-container-low active:opacity-70"
              >
                <X size={20} color="#434655" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-4 py-2">
                <View>
                  <Text className="text-xs font-semibold text-on-surface-variant mb-1.5">
                    Category <Text className="text-error">*</Text>
                  </Text>
                  <Pressable
                    onPress={() => setCategoryPickerVisible(true)}
                    className="border border-outline-variant/40 rounded-xl px-4 py-3.5 flex-row items-center justify-between bg-surface-container-low active:opacity-70"
                  >
                    <View className="flex-row items-center gap-2">
                      <Tag size={16} color="#737686" />
                      <Text
                        className={
                          selectedCategory
                            ? "text-on-surface font-semibold"
                            : "text-[#737686]"
                        }
                      >
                        {selectedCategory
                          ? selectedCategory.label
                          : "Select category..."}
                      </Text>
                    </View>
                    <ChevronDown size={18} color="#737686" />
                  </Pressable>
                </View>

                <FormField
                  label="Amount (ETB)"
                  required
                  placeholder="0.00"
                  value={form.amount}
                  onChangeText={(v) => setForm((p) => ({ ...p, amount: v }))}
                  keyboardType="decimal-pad"
                />

                <DateField
                  label="Date Incurred"
                  value={expenseDate}
                  onChange={setExpenseDate}
                />

                <FormField
                  label="Description (optional)"
                  placeholder="e.g. Monthly electricity bill or office supplies"
                  value={form.description}
                  onChangeText={(v) =>
                    setForm((p) => ({ ...p, description: v }))
                  }
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className="bg-primary rounded-xl py-4 items-center active:opacity-90 mt-2"
              style={{ opacity: isSaving ? 0.6 : 1 }}
            >
              <Text className="text-white font-bold text-base">
                {isSaving
                  ? "Saving Entry..."
                  : editingId
                    ? "Save Changes"
                    : "Log Expense"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Category Picker Modal */}
      <Modal visible={categoryPickerVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[70%] border-t border-outline-variant/20">
            <View className="flex-row justify-between items-center pb-2 border-b border-outline-variant/20">
              <Text className="text-lg font-bold text-on-surface">
                Select Category
              </Text>
              <Pressable
                onPress={() => setCategoryPickerVisible(false)}
                className="p-1 rounded-full bg-surface-container-low active:opacity-70"
              >
                <X size={20} color="#434655" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-2 py-2">
                {CATEGORIES.map((c) => {
                  const isSelected = c.id === form.category;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        setForm((p) => ({ ...p, category: c.id }));
                        setCategoryPickerVisible(false);
                      }}
                      className={`p-4 rounded-xl border flex-row items-center justify-between active:opacity-70 ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-outline-variant/30 bg-surface-container-low"
                      }`}
                    >
                      <Text
                        className={`font-semibold text-base ${
                          isSelected ? "text-primary" : "text-on-surface"
                        }`}
                      >
                        {c.label}
                      </Text>
                      {isSelected ? (
                        <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
