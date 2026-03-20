import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLot, deleteLot, getLots, getLotsByReception, updateLot } from "@/features/lots/api/lots.api";
import { lotsKeys } from "@/features/lots/api/lots.keys";
import { receptionsKeys } from "@/features/receptions/api/receptions.keys";
import type {
  LotCreateRequest,
  LotDeleteRequest,
  LotListParams,
  LotUpdateRequest,
  LotsByReceptionParams,
} from "@/features/lots/lots.types";

export function useLotsList(params: LotListParams) {
  return useQuery({
    queryKey: lotsKeys.list(params),
    queryFn: () => getLots(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useLotsByReception(params: LotsByReceptionParams) {
  return useQuery({
    queryKey: lotsKeys.byReception(params),
    queryFn: () => getLotsByReception(params),
    placeholderData: (previousData) => previousData,
    enabled: params.receptionId.length > 0,
  });
}

export function useCreateLot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LotCreateRequest) => createLot(payload),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: lotsKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: lotsKeys.byReceptions() });
      if (payload.receptionId) {
        await queryClient.invalidateQueries({ queryKey: receptionsKeys.detail(payload.receptionId) });
      }
    },
  });
}

export function useDeleteLot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LotDeleteRequest) => deleteLot(payload),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: lotsKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: lotsKeys.byReceptions() });
      if (payload.receptionId) {
        await queryClient.invalidateQueries({ queryKey: receptionsKeys.detail(payload.receptionId) });
      }
    },
  });
}

export function useUpdateLot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LotUpdateRequest) => updateLot(payload),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: lotsKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: lotsKeys.byReceptions() });
      if (payload.receptionId) {
        await queryClient.invalidateQueries({ queryKey: receptionsKeys.detail(payload.receptionId) });
      }
    },
  });
}
