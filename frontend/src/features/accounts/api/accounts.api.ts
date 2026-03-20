import { api } from "@/shared/api/apiClient";
import type { Account } from "@/features/accounts/api/accounts.types";

export async function getAccounts(): Promise<Account[]> {
  const res = await api.get<Account[]>("/api/accounts");
  return res.data;
}

export async function getMyAccount(): Promise<Account> {
  const res = await api.get<Account>("/api/accounts/me");
  return res.data;
}

export async function changeMyPassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}): Promise<void> {
  await api.post("/api/accounts/me/change-password", payload);
}

export async function deleteAccount(accountId: string): Promise<void> {
  await api.delete(`/api/accounts/${accountId}`);
}

export async function deleteMyAccount(): Promise<void> {
  await api.delete("/api/accounts/me");
}
