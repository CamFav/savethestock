import axios from "axios";
import type { AxiosError } from "axios";
import { getJwtToken, useSessionStore } from "@/shared/auth/sessionStore";

const rawBaseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const baseURL = rawBaseURL && rawBaseURL !== "/" ? rawBaseURL.replace(/\/+$/, "") : undefined;

const timeoutMsRaw = import.meta.env.VITE_API_TIMEOUT_MS as string | undefined;
const timeout = timeoutMsRaw ? Number(timeoutMsRaw) : 15000;

export type ApiError = {
  status: number;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

type ApiErrorPayload = {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

export const api = axios.create({
  baseURL,
  timeout,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-CSRF-TOKEN",
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
      const payload = data as ApiErrorPayload;
      if (typeof payload.title === "string") message = payload.title;
      if (typeof payload.detail === "string" && !message) message = payload.detail;
      if (payload.errors && typeof payload.errors === "object") {
        const firstFieldError = Object.values(payload.errors).find(
          (value) => Array.isArray(value) && value.length > 0 && typeof value[0] === "string",
        );
        if (!message && firstFieldError) {
          message = firstFieldError[0];
        }
      }
    }

    if (status === 401) {
      useSessionStore.getState().clearSession();
    }

    const fieldErrors =
      data && typeof data === "object" && "errors" in (data as object)
        ? ((data as ApiErrorPayload).errors ?? undefined)
        : undefined;

    const apiError: ApiError = { status, message, fieldErrors };
    return Promise.reject(apiError);
  }
);
