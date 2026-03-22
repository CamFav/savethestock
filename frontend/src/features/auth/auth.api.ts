import { api } from "@/shared/api/apiClient";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/features/auth/auth.types";

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/api/auth/login", payload);
  return res.data;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/api/auth/register", payload);
  return res.data;
}

export async function logout(): Promise<void> {
  await api.post("/api/auth/logout");
}
