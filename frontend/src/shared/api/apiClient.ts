import axios from "axios";
import type { AxiosError } from "axios";
import { getJwtToken, useSessionStore } from "@/shared/auth/sessionStore";

const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;
if (!baseURL) {
  throw new Error("Missing VITE_API_BASE_URL");
}

const timeoutMsRaw = import.meta.env.VITE_API_TIMEOUT_MS as string | undefined;
const timeout = timeoutMsRaw ? Number(timeoutMsRaw) : 15000;

export type ApiError = {
  status: number;
  message?: string;
};

export const api = axios.create({
  baseURL,
  timeout,
});

api.interceptors.request.use((config) => {
  const token = getJwtToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    const status = err.response?.status ?? 0;

    let message: string | undefined;
    const data = err.response?.data as unknown;
    if (typeof data === "string" && data.trim().length > 0) {
      message = data;
    } else if (data && typeof data === "object") {
      const anyData = data as any;
      if (typeof anyData.title === "string") message = anyData.title;
      if (typeof anyData.detail === "string" && !message) message = anyData.detail;
    }

    if (status === 401) {
      useSessionStore.getState().clearSession();
    }

    const apiError: ApiError = { status, message };
    return Promise.reject(apiError);
  }
);
