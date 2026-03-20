import { api } from "@/shared/api/apiClient";
import type {
  AcceptInvitationPayload,
  AcceptInvitationResponse,
  CreateInvitationPayload,
  Invitation,
  InvitationToken,
} from "@/features/invitations/api/invitations.types";

export async function getInvitations(): Promise<Invitation[]> {
  const res = await api.get<Invitation[]>("/api/invitations");
  return res.data;
}

export async function createInvitation(payload: CreateInvitationPayload): Promise<Invitation> {
  const res = await api.post<Invitation>("/api/invitations", payload);
  return res.data;
}

export async function revokeInvitation(id: string): Promise<void> {
  await api.post(`/api/invitations/${id}/revoke`);
}

export async function getInvitationByToken(token: string): Promise<InvitationToken> {
  const res = await api.get<InvitationToken>(`/api/invitations/token/${token}`);
  return res.data;
}

export async function acceptInvitation(token: string, payload: AcceptInvitationPayload): Promise<AcceptInvitationResponse> {
  const res = await api.post<AcceptInvitationResponse>(`/api/invitations/token/${token}/accept`, payload);
  return res.data;
}

