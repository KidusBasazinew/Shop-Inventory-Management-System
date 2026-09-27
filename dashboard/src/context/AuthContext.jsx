/* eslint-disable react-refresh/only-export-components -- context + hook live together by design */
import { createContext, useContext, useMemo, useState } from "react";
import {
  adminApi,
  getStoredAuth,
  storeAuth,
  storeRefreshToken,
  clearAuth,
} from "../lib/api";

/**
 * Auth context for the platform-owner dashboard.
 * Session persists in localStorage; refresh tokens handled by the
 * axios interceptor in lib/api.js.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { token, admin } = getStoredAuth();
  const [user, setUser] = useState(token ? admin : null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await adminApi.login({ email, password });
      storeAuth(data.accessToken, data.user);
      storeRefreshToken(data.refreshToken);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message =
        err?.response?.data?.error ?? "Login failed. Check your credentials.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isLoading, error, login, logout }),
    [user, isLoading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
