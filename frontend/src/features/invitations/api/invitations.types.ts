import type { AuthResponse } from "@/features/auth/auth.types";

export type Invitation = {
  id: string;
  companyId: string;
  companyName: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdByAccountId: string;
  revokedAt: string | null;
  invitationPath: string;
};

export type InvitationToken = {
  id: string;
  companyName: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  expiresAt: string;
};

export type CreateInvitationPayload = {
  displayName: string;
  email: string;
  role: "MEMBER";
};

export type AcceptInvitationPayload = {
  mode: "REGISTER" | "LOGIN";
  password: string;
};

export type AcceptInvitationResponse = AuthResponse;

export function getInvitationStatusLabel(status: string): string {
  const normalized = status.trim().toUpperCase();
  if (normalized === "PENDING") return "En attente";
  if (normalized === "ACCEPTED") return "Acceptée";
  if (normalized === "EXPIRED") return "Expirée";
  if (normalized === "REVOKED") return "Annulée";
  return status;
}

