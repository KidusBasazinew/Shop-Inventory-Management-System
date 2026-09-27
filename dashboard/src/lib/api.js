import axios from "axios";

/**
 * Platform-owner dashboard API client.
 *
 * Talks to the same Express API as the mobile app but hits /admin/*
 * endpoints with an ADMIN-role JWT. The token lives in localStorage —
 * this dashboard is only for you (the software owner), never the shops.
 */
export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

const api = axios.create({ baseURL: API_URL, timeout: 20000 });

const TOKEN_KEY = "platform_admin_token";
const ADMIN_KEY = "platform_admin_user";
const REFRESH_KEY = "platform_admin_refresh";

export function getStoredAuth() {
  try {
    return {
      token: localStorage.getItem(TOKEN_KEY),
      admin: JSON.parse(localStorage.getItem(ADMIN_KEY) || "null"),
      refreshToken: localStorage.getItem(REFRESH_KEY),
    };
  } catch {
    return { token: null, admin: null, refreshToken: null };
  }
}

export function storeAuth(token, admin) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function storeRefreshToken(refreshToken) {
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

api.interceptors.request.use((config) => {
  const { token } = getStoredAuth();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: try a refresh once, else log out.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    try {
      const { refreshToken } = getStoredAuth();
      if (!refreshToken) throw new Error("no refresh token");
      refreshing =
        refreshing ??
        axios.post(`${API_URL}/admin/refresh`, { refreshToken });
      const { data } = await refreshing;
      refreshing = null;
      storeAuth(data.accessToken, getStoredAuth().admin);
      storeRefreshToken(data.refreshToken);
      original._retry = true;
      return api(original);
    } catch {
      refreshing = null;
      clearAuth();
      if (!window.location.pathname.includes("login")) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  },
);

// ---------- API surface ----------

export const adminApi = {
  login: (body) => axios.post(`${API_URL}/admin/login`, body),

  overview: () => api.get("/admin/overview"),

  listShops: (params) => api.get("/admin/shops", { params }),
  getShop: (id) => api.get(`/admin/shops/${id}`),
  resetOwnerPassword: (id, newPassword) =>
    api.patch(`/admin/shops/${id}/reset-owner-password`, { newPassword }),
  extendSubscription: (id, days) =>
    api.patch(`/admin/shops/${id}/extend`, { days }),
  toggleShopActive: (id, isActive) =>
    api.patch(`/admin/shops/${id}/active`, { isActive }),

  listPayments: (status) =>
    api.get("/admin/subscription-payments", { params: { status } }),
  reviewPayment: (id, decision, note) =>
    api.patch(`/admin/subscription-payments/${id}/review`, { decision, note }),
  paymentScreenshotUrl: (id) =>
    `${API_URL}/admin/subscription-payments/${id}/screenshot`,

  listEvents: (params) => api.get("/admin/events", { params }),
  listOutreach: (params) => api.get("/admin/outreach", { params }),
  createOutreach: (body) => api.post("/admin/outreach", body),
  updateOutreach: (id, body) => api.patch(`/admin/outreach/${id}`, body),
};

/**
 * Screenshots are private — the <img> tag can't attach an Authorization
 * header, so we fetch the bytes ourselves (auth header included) and
 * hand back a short-lived blob URL for rendering.
 */
export async function fetchScreenshotBlobUrl(kind, id) {
  const url =
    kind === "admin"
      ? `${API_URL}/admin/subscription-payments/${id}/screenshot`
      : `${API_URL}/subscription/payments/${id}/screenshot`;
  const res = await api.get(url, { responseType: "blob" });
  return URL.createObjectURL(res.data);
}

export default api;
