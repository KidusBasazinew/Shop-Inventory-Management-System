import { createContext, useContext, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import {
  saveTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from "../lib/secureStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      setIsLoading(false);
    })();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async ({ phone, password }) => {
      const { data } = await api.post("/auth/login", { phone, password });
      return data;
    },
    onSuccess: async (data) => {
      await saveTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      setUser(data.user);
      setShop(data.shop);
      queryClient.setQueryData(["shop-me"], data.shop);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/auth/register", payload);
      return data;
    },
    onSuccess: async (data) => {
      await saveTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      setUser(data.user);
      setShop(data.shop);
      queryClient.setQueryData(["shop-me"], data.shop); // ← add this
    },
  });

  const logout = async () => {
    try {
      const refreshToken = await getRefreshToken();
      await api.post("/auth/logout", { refreshToken });
    } catch (e) {
      // logout is idempotent server-side — ignore network errors here
    } finally {
      await clearTokens();
      setUser(null);
      setShop(null);
      queryClient.removeQueries({ queryKey: ["shop-me"] });
    }
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        isLoading,
        login: loginMutation.mutateAsync,
        loginPending: loginMutation.isPending,
        loginError: loginMutation.error,
        register: registerMutation.mutateAsync,
        registerPending: registerMutation.isPending,
        registerError: registerMutation.error,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
