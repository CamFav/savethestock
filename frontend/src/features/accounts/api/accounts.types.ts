import { normalizeRole, type AppRole } from "@/shared/auth/roles";

export type Account = {
  id: string;
  companyId: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  deletedAt: string | null;
  mustChangePassword: boolean;
};

export type AccountStatus = "ACTIVE" | "ACTIVATION_REQUIRED" | "INACTIVE";

export function getAccountRole(role: string): AppRole | null {
  return normalizeRole(role);
}

export function getAccountRoleLabel(role: string): string {
  const normalized = getAccountRole(role);
  if (normalized === "OWNER") return "Proprietaire";
  if (normalized === "MEMBER") return "Membre";
  return role.toUpperCase();
}

export function getAccountStatus(account: Account): AccountStatus {
  if (!account.isActive) return "INACTIVE";
  if (account.mustChangePassword) return "ACTIVATION_REQUIRED";
  return "ACTIVE";
}

export function getAccountStatusLabel(status: AccountStatus): string {
  if (status === "ACTIVATION_REQUIRED") return "Activation requise";
  if (status === "INACTIVE") return "Inactif";
  return "Actif";
}
