import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import {
  Store,
  MapPin,
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, registerPending, registerError } = useAuth();

  const [form, setForm] = useState({
    shopName: "",
    shopLocation: "",
    ownerName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const update = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    const {
      shopName,
      shopLocation,
      ownerName,
      phone,
      password,
      confirmPassword,
    } = form;

    if (!shopName || !ownerName || !phone || !password) {
      setLocalError("Please fill in all required fields");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    setLocalError("");
    try {
      await register({
        shopName,
        shopLocation,
        ownerName,
        phone,
        password,
      });
      router.replace("/(app)/overview");
    } catch (e) {
      // registerError handled by context
    }
  };

  const serverErrorMessage =
    registerError?.response?.data?.message ||
    registerError?.response?.data?.error;
  const errorMessage = localError || serverErrorMessage;

  const canSubmit =
    form.shopName &&
    form.ownerName &&
    form.phone &&
    form.password &&
    form.confirmPassword &&
    !registerPending;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-7 py-10">
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-4">
              <ShieldCheck size={28} color="#2563eb" strokeWidth={1.75} />
            </View>
            <Text className="text-xl font-bold text-primary">
              Create your account
            </Text>
            <Text className="text-sm text-on-surface-variant mt-1 text-center">
              Set up your shop on KLABS
            </Text>
          </View>

          {errorMessage ? (
            <View className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-5">
              <Text className="text-red-600 text-sm">{errorMessage}</Text>
            </View>
          ) : null}

          <SectionLabel text="Shop Details" />
          <View className="gap-3 mb-6">
            <Field
              icon={Store}
              value={form.shopName}
              onChangeText={update("shopName")}
              placeholder="Shop name"
            />
            <Field
              icon={MapPin}
              value={form.shopLocation}
              onChangeText={update("shopLocation")}
              placeholder="Location (e.g. Bole, Addis Ababa)"
            />
          </View>

          <SectionLabel text="Your Details" />
          <View className="gap-3">
            <Field
              icon={User}
              value={form.ownerName}
              onChangeText={update("ownerName")}
              placeholder="Full name"
            />
            <Field
              icon={Phone}
              value={form.phone}
              onChangeText={update("phone")}
              placeholder="Phone number"
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            <Field
              icon={Lock}
              value={form.password}
              onChangeText={update("password")}
              placeholder="Password"
              secureTextEntry={!showPassword}
              rightElement={
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={10}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#94a3b8" />
                  ) : (
                    <Eye size={18} color="#94a3b8" />
                  )}
                </Pressable>
              }
            />
            <Field
              icon={Lock}
              value={form.confirmPassword}
              onChangeText={update("confirmPassword")}
              placeholder="Confirm password"
              secureTextEntry={!showConfirmPassword}
              rightElement={
                <Pressable
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  hitSlop={10}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color="#94a3b8" />
                  ) : (
                    <Eye size={18} color="#94a3b8" />
                  )}
                </Pressable>
              }
            />
          </View>

          <Pressable
            onPress={handleRegister}
            disabled={!canSubmit}
            className="rounded-2xl py-4 items-center mt-8 flex-row justify-center gap-2"
            style={{ backgroundColor: "#2563eb", opacity: canSubmit ? 1 : 0.5 }}
          >
            {registerPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text className="text-white font-semibold text-[15px]">
                  Create Account
                </Text>
                <ArrowRight size={16} color="#ffffff" />
              </>
            )}
          </Pressable>

          <View className="flex-row justify-center mt-6">
            <Text className="text-on-surface-variant text-sm">
              Already have an account?{" "}
            </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text className="text-primary font-semibold text-sm">
                  Sign In
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionLabel({ text }) {
  return (
    <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
      {text}
    </Text>
  );
}

function Field({ icon: Icon, rightElement, ...inputProps }) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      className="flex-row items-center border rounded-2xl px-4"
      style={{
        borderColor: focused ? "#2563eb" : "rgba(0,0,0,0.08)",
        borderWidth: focused ? 1.5 : 1,
      }}
    >
      <Icon size={18} color={focused ? "#2563eb" : "#94a3b8"} />
      <TextInput
        {...inputProps}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor="#94a3b8"
        className="flex-1 px-3 py-3.5 text-[15px] text-on-surface"
      />
      {rightElement}
    </View>
  );
}
