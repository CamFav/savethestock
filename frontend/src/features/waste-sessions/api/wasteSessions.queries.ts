import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addWasteLine,
  createWasteSession,
  deleteWasteLine,
  deleteWasteSession,
  getWasteSession,
  listWasteSessions,
  postWasteSession,
  updateWasteLine,
} from "@/features/waste-sessions/api/wasteSessions.api";
import { wasteSessionsKeys } from "@/features/waste-sessions/api/wasteSessions.keys";
import { lotsKeys } from "@/features/lots/api/lots.keys";
import type {
  AddWasteLinePayload,
  CreateWasteSessionPayload,
  DeleteWasteLinePayload,
  DeleteWasteSessionPayload,
  UpdateWasteLinePayload,
  WasteSessionsListParams,
} from "@/features/waste-sessions/api/wasteSessions.types";

export function useWasteSessionsList(params: WasteSessionsListParams) {
  return useQuery({
    queryKey: wasteSessionsKeys.list(params),
    queryFn: () => listWasteSessions(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useWasteSessionDetail(id: string) {
  return useQuery({
    queryKey: wasteSessionsKeys.detail(id),
    queryFn: () => getWasteSession(id),
    enabled: id.length > 0,
  });
}

export function useCreateWasteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWasteSessionPayload) => createWasteSession(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: wasteSessionsKeys.lists() });
    },
  });
}

export function useAddWasteLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: string; payload: AddWasteLinePayload }) => addWasteLine(sessionId, payload),
    onSuccess: async (_, vars) => {
      await queryClient.invalidateQueries({ queryKey: wasteSessionsKeys.detail(vars.sessionId) });
      await queryClient.invalidateQueries({ queryKey: wasteSessionsKeys.lists() });
    },
  });
}

export function useUpdateWasteLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateWasteLinePayload) => updateWasteLine(payload),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: wasteSessionsKeys.detail(payload.sessionId) });
      await queryClient.invalidateQueries({ queryKey: wasteSessionsKeys.lists() });
    },
  });
}

export function useDeleteWasteLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteWasteLinePayload) => deleteWasteLine(payload),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: wasteSessionsKeys.detail(payload.sessionId) });
      await queryClient.invalidateQueries({ queryKey: wasteSessionsKeys.lists() });
    },
  });
}

export function useDeleteWasteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteWasteSessionPayload) => deleteWasteSession(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: wasteSessionsKeys.lists() });
    },
  });
}

export function usePostWasteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => postWasteSession(sessionId),
    onSuccess: async (_, sessionId) => {
      await queryClient.invalidateQueries({ queryKey: wasteSessionsKeys.detail(sessionId) });
      await queryClient.invalidateQueries({ queryKey: wasteSessionsKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: lotsKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: lotsKeys.byReceptions() });
    },
  });
}
