import { useMutation, useQuery } from "@tanstack/react-query";
import {
  acceptInvitation,
  createInvitation,
  getInvitationByToken,
  getInvitations,
  revokeInvitation,
} from "@/features/invitations/api/invitations.api";
import { invitationsKeys } from "@/features/invitations/api/invitations.keys";
import type { AcceptInvitationPayload, CreateInvitationPayload } from "@/features/invitations/api/invitations.types";

export function useInvitationsList() {
  return useQuery({
    queryKey: invitationsKeys.list(),
    queryFn: getInvitations,
  });
}

export function useCreateInvitation() {
  return useMutation({
    mutationFn: (payload: CreateInvitationPayload) => createInvitation(payload),
  });
}

export function useRevokeInvitation() {
  return useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
  });
}

export function useInvitationToken(token: string) {
  return useQuery({
    queryKey: invitationsKeys.token(token),
    queryFn: () => getInvitationByToken(token),
    enabled: token.trim().length > 0,
    retry: false,
  });
}

export function useAcceptInvitation(token: string) {
  return useMutation({
    mutationFn: (payload: AcceptInvitationPayload) => acceptInvitation(token, payload),
  });
}

