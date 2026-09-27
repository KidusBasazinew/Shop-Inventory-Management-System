import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from "./secureStore";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

// Device headers — the server records a daily AppSession (usage
// analytics for the platform owner) from every authenticated request.
api.interceptors.request.use(async (config) => {
  config.headers["x-os-name"] = Platform.OS;
  const appVersion = Constants.expoConfig?.version;
  if (appVersion) config.headers["x-app-version"] = appVersion;

  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh-on-401 with request queueing
let isRefreshing = false;
let refreshQueue = [];

function resolveQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Auth requests must surface their own 401 response. They do not have an
    // existing session to refresh.
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      await clearTokens();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // queue this request until the in-flight refresh resolves
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axios.post(`${apiBaseUrl}/auth/refresh`, {
        refreshToken,
      });

      await saveTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      resolveQueue(null, data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      resolveQueue(refreshError, null);
      await clearTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
