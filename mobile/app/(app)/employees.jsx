import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack, router } from "expo-router";
import {
  Plus,
  X,
  Phone,
  Briefcase,
  ChevronRight,
  Wallet,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  usePayroll,
  useCreatePayroll,
} from "../../hooks/useEmployees";
import FormField from "../../components/common/FormField";
import DateField from "../../components/common/DateField";
import EmptyState from "../../components/common/EmptyState";
import FAB from "../../components/common/FAB";
import Badge from "../../components/common/Badge";
import { playSuccess, playError } from "../../lib/feedback";

const EMPTY_FORM = { name: "", phone: "", position: "", salary: "" };

export default function EmployeesScreen() {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER" || user?.role === "MANAGER";

  const { data, isLoading, isError, refetch, isRefetching } = useEmployees();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [payrollTarget, setPayrollTarget] = useState(null);

  const employees = data?.items ?? [];

  if (!canManage) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-on-surface font-bold text-lg text-center mb-1">
          Access Restricted
        </Text>
        <Text className="text-on-surface-variant text-xs text-center">
          Employees & payroll are visible to Owners and Managers only.
        </Text>
      </View>
    );
  }

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalVisible(true);
  };

  const openEdit = (employee) => {
    setForm({
      name: employee.name ?? "",
      phone: employee.phone ?? "",
      position: employee.position ?? "",
      salary: String(employee.salary ?? ""),
    });
    setEditingId(employee.id);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.salary) {
      Alert.alert("Missing fields", "Name and salary are required");
      return;
    }
    const payload = {
      name: form.name,
      phone: form.phone || undefined,
      position: form.position || undefined,
      salary: Number(form.salary),
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      playSuccess();
      setModalVisible(false);
    } catch (e) {
      playError();
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to save employee",
      );
    }
  };

  const toggleStatus = async (employee) => {
    const nextStatus = employee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateMutation.mutateAsync({
        id: employee.id,
        payload: { status: nextStatus },
      });
      playSuccess();
    } catch (e) {
      playError();
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to update status",
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
          Failed to load employees
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
        options={{ headerShown: true, title: "Employees & Payroll" }}
      />

      <FlatList
        data={employees}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 20,
          gap: 12,
          paddingBottom: 100,
          flexGrow: 1,
        }}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon={Briefcase}
            title="No employees yet"
            description="Add your team to start tracking payroll."
          />
        }
        renderItem={({ item }) => (
          <View className="bg-surface rounded-2xl border border-outline-variant/30 p-4 gap-3 shadow-xs">
            <Pressable
              onPress={() => openEdit(item)}
              className="flex-row items-center justify-between"
            >
              <View className="flex-1 pr-2">
                <View className="flex-row items-center gap-2">
                  <Text className="font-bold text-sm text-on-surface">
                    {item.name}
                  </Text>
                  {item.status === "INACTIVE" ? (
                    <Badge label="Inactive" tone="error" />
                  ) : null}
                </View>
                {item.position ? (
                  <Text className="text-xs text-on-surface-variant mt-0.5">
                    {item.position}
                  </Text>
                ) : null}
                {item.phone ? (
                  <View className="flex-row items-center gap-1 mt-1">
                    <Phone size={11} color="#9aa0a6" />
                    <Text className="text-[11px] text-outline">
                      {item.phone}
                    </Text>
                  </View>
                ) : null}
              </View>
              <ChevronRight size={18} color="#c3c6d7" />
            </Pressable>

            <View className="flex-row items-center justify-between pt-2 border-t border-outline-variant/15">
              <Text className="text-xs font-semibold text-on-surface-variant">
                Salary: ETB {Number(item.salary).toLocaleString()}
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => toggleStatus(item)}
                  className="px-2.5 py-1.5 rounded-lg border border-outline-variant/40"
                >
                  <Text className="text-[11px] font-semibold text-on-surface-variant">
                    {item.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setPayrollTarget(item)}
                  className="px-2.5 py-1.5 rounded-lg bg-primary/10 flex-row items-center gap-1"
                >
                  <Wallet size={12} color="#004ac6" />
                  <Text className="text-[11px] font-semibold text-primary">
                    Payroll
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <FAB icon={Plus} onPress={openCreate} />

      {/* Create / edit employee */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/40 justify-end"
        >
          <View className="bg-surface rounded-t-3xl p-6 gap-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-on-surface">
                {editingId ? "Edit Employee" : "New Employee"}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={22} color="#434655" />
              </Pressable>
            </View>

            <FormField
              label="Name"
              required
              value={form.name}
              onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholder="Full name"
            />
            <FormField
              label="Phone"
              value={form.phone}
              onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
              placeholder="0911223344"
              keyboardType="phone-pad"
            />
            <FormField
              label="Position"
              value={form.position}
              onChangeText={(v) => setForm((p) => ({ ...p, position: v }))}
              placeholder="e.g. Cashier"
            />
            <FormField
              label="Salary"
              required
              value={form.salary}
              onChangeText={(v) => setForm((p) => ({ ...p, salary: v }))}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="bg-primary rounded-xl py-4 items-center"
              style={{ opacity: saving ? 0.6 : 1 }}
            >
              <Text className="text-white font-semibold">
                {saving ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <PayrollModal
        employee={payrollTarget}
        onClose={() => setPayrollTarget(null)}
      />
    </View>
  );
}

function PayrollModal({ employee, onClose }) {
  const { data, isLoading } = usePayroll(employee?.id, { limit: 20 });
  const createPayroll = useCreatePayroll();

  const [formVisible, setFormVisible] = useState(false);
  const [bonus, setBonus] = useState("0");
  const [deduction, setDeduction] = useState("0");
  const [amountPaid, setAmountPaid] = useState("");
  const [date, setDate] = useState(new Date());

  const payments = data?.items ?? [];

  const openForm = () => {
    setBonus("0");
    setDeduction("0");
    setAmountPaid(employee?.salary ? String(employee.salary) : "");
    setDate(new Date());
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    if (!amountPaid || Number(amountPaid) < 0) {
      Alert.alert("Missing fields", "Enter the amount paid");
      return;
    }
    try {
      await createPayroll.mutateAsync({
        employeeId: employee.id,
        payload: {
          salary: Number(employee.salary),
          bonus: Number(bonus) || 0,
          deduction: Number(deduction) || 0,
          amountPaid: Number(amountPaid),
          date: date.toISOString(),
        },
      });
      playSuccess();
      setFormVisible(false);
    } catch (e) {
      playError();
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Failed to record payroll payment",
      );
    }
  };

  return (
    <Modal visible={!!employee} animationType="slide" transparent>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-surface rounded-t-3xl p-6 gap-4 max-h-[85%]">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-on-surface">
              {employee?.name} — Payroll
            </Text>
            <Pressable onPress={onClose}>
              <X size={22} color="#434655" />
            </Pressable>
          </View>

          {formVisible ? (
            <View className="gap-3">
              <FormField
                label="Base salary"
                value={String(employee?.salary ?? "")}
                editable={false}
              />
              <FormField
                label="Bonus"
                value={bonus}
                onChangeText={setBonus}
                keyboardType="decimal-pad"
              />
              <FormField
                label="Deduction"
                value={deduction}
                onChangeText={setDeduction}
                keyboardType="decimal-pad"
              />
              <FormField
                label="Amount paid"
                required
                value={amountPaid}
                onChangeText={setAmountPaid}
                keyboardType="decimal-pad"
              />
              <DateField label="Date" value={date} onChange={setDate} />

              <View className="flex-row gap-3 mt-1">
                <Pressable
                  onPress={() => setFormVisible(false)}
                  className="flex-1 border border-outline-variant/40 rounded-xl py-3 items-center"
                >
                  <Text className="text-on-surface-variant font-semibold text-xs">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit}
                  disabled={createPayroll.isPending}
                  className="flex-1 bg-primary rounded-xl py-3 items-center"
                >
                  <Text className="text-white font-semibold text-xs">
                    {createPayroll.isPending ? "Saving..." : "Confirm"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <Pressable
                onPress={openForm}
                className="bg-primary rounded-xl py-3 items-center"
              >
                <Text className="text-white font-bold text-xs">
                  Record Payroll Payment
                </Text>
              </Pressable>

              {isLoading ? (
                <ActivityIndicator color="#004ac6" />
              ) : payments.length === 0 ? (
                <Text className="text-center text-on-surface-variant text-xs py-6">
                  No payroll history yet
                </Text>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="gap-2 pb-2">
                    {payments.map((p) => (
                      <View
                        key={p.id}
                        className="p-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-low"
                      >
                        <View className="flex-row justify-between">
                          <Text className="text-xs font-semibold text-on-surface">
                            {new Date(p.date).toLocaleDateString()}
                          </Text>
                          <Text className="text-sm font-extrabold text-primary">
                            ETB {Number(p.amountPaid).toLocaleString()}
                          </Text>
                        </View>
                        <Text className="text-[11px] text-on-surface-variant mt-1">
                          Base {Number(p.salary).toLocaleString()} + Bonus{" "}
                          {Number(p.bonus).toLocaleString()} − Deduction{" "}
                          {Number(p.deduction).toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
