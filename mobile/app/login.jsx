import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loginPending, loginError } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async () => {
    if (!phone || !password) return;
    try {
      await login({ phone, password });
      router.replace("/(app)/overview");
    } catch (e) {
      // loginError from the mutation already reflects this
    }
  };

  const errorMessage =
    loginError?.response?.data?.message ||
    loginError?.response?.data?.error ||
    (loginError ? "Something went wrong. Please try again." : null);

  const canSubmit = phone.length > 0 && password.length > 0 && !loginPending;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-7">
          {/* Brand mark — same soft-circle language as onboarding */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-4">
              <ShieldCheck size={28} color="#2563eb" strokeWidth={1.75} />
            </View>
            <Text className="text-xl font-bold text-primary">Welcome back</Text>
            <Text className="text-sm text-on-surface-variant mt-1">
              Sign in to continue to KLABS
            </Text>
          </View>

          {errorMessage ? (
            <View className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-5">
              <Text className="text-red-600 text-sm">{errorMessage}</Text>
            </View>
          ) : null}

          <View className="gap-4">
            {/* Phone field */}
            <View
              className="flex-row items-center border rounded-2xl px-4"
              style={{
                borderColor:
                  focusedField === "phone" ? "#2563eb" : "rgba(0,0,0,0.08)",
                borderWidth: focusedField === "phone" ? 1.5 : 1,
              }}
            >
              <Phone
                size={18}
                color={focusedField === "phone" ? "#2563eb" : "#94a3b8"}
              />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                keyboardType="phone-pad"
                placeholder="Phone number"
                placeholderTextColor="#94a3b8"
                className="flex-1 px-3 py-3.5 text-[15px] text-on-surface"
              />
            </View>

            {/* Password field */}
            <View
              className="flex-row items-center border rounded-2xl px-4"
              style={{
                borderColor:
                  focusedField === "password" ? "#2563eb" : "rgba(0,0,0,0.08)",
                borderWidth: focusedField === "password" ? 1.5 : 1,
              }}
            >
              <Lock
                size={18}
                color={focusedField === "password" ? "#2563eb" : "#94a3b8"}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                className="flex-1 px-3 py-3.5 text-[15px] text-on-surface"
              />
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
            </View>
          </View>

          <Pressable className="self-end mt-3">
            <Text className="text-primary text-sm font-medium">
              Forgot password?
            </Text>
          </Pressable>

          <Pressable
            onPress={handleLogin}
            disabled={!canSubmit}
            className="rounded-2xl py-4 items-center mt-8 flex-row justify-center gap-2"
            style={{ backgroundColor: "#2563eb", opacity: canSubmit ? 1 : 0.5 }}
          >
            <Text className="text-white font-semibold text-[15px]">
              {loginPending ? "Signing in..." : "Sign In"}
            </Text>
            {!loginPending && <ArrowRight size={16} color="#ffffff" />}
          </Pressable>

          <View className="flex-row justify-center mt-6">
            <Text className="text-on-surface-variant text-sm">
              Don't have an account?{" "}
            </Text>
            <Link href="/register" asChild>
              <Pressable>
                <Text className="text-primary font-semibold text-sm">
                  Register
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
