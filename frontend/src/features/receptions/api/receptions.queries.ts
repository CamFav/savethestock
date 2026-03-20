import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReception,
  getReceptionById,
  getReceptions,
} from "@/features/receptions/api/receptions.api";
import { receptionsKeys } from "@/features/receptions/api/receptions.keys";
import type {
  ReceptionCreateRequest,
  ReceptionsListParams,
} from "@/features/receptions/receptions.types";

export function useReceptionsList(params: ReceptionsListParams) {
  return useQuery({
    queryKey: receptionsKeys.list(params),
    queryFn: () => getReceptions(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useReceptionDetail(id: string) {
  return useQuery({
    queryKey: receptionsKeys.detail(id),
    queryFn: () => getReceptionById(id),
    enabled: id.length > 0,
  });
}

export function useCreateReception() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReceptionCreateRequest) => createReception(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: receptionsKeys.lists() });
    },
  });
}
