import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInventory,
  deleteInventoryLine,
  getInventory,
  listInventories,
  postInventory,
  updateInventoryLine,
  upsertInventoryLine,
} from "@/features/inventories/api/inventories.api";
import { inventoriesKeys } from "@/features/inventories/api/inventories.keys";
import { lotsKeys } from "@/features/lots/api/lots.keys";
import type {
  CreateInventoryPayload,
  DeleteInventoryLinePayload,
  InventoriesListParams,
  UpdateInventoryLinePayload,
  UpsertInventoryLinePayload,
} from "@/features/inventories/api/inventories.types";

export function useInventoriesList(params: InventoriesListParams) {
  return useQuery({
    queryKey: inventoriesKeys.list(params),
    queryFn: () => listInventories(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useInventoryDetail(id: string) {
  return useQuery({
    queryKey: inventoriesKeys.detail(id),
    queryFn: () => getInventory(id),
    enabled: id.length > 0,
  });
}

export function useCreateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInventoryPayload) => createInventory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoriesKeys.lists() });
    },
  });
}

export function useUpsertInventoryLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ inventoryId, payload }: { inventoryId: string; payload: UpsertInventoryLinePayload }) =>
      upsertInventoryLine(inventoryId, payload),
    onSuccess: async (_, vars) => {
      await queryClient.invalidateQueries({ queryKey: inventoriesKeys.detail(vars.inventoryId) });
      await queryClient.invalidateQueries({ queryKey: inventoriesKeys.lists() });
    },
  });
}

export function useUpdateInventoryLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateInventoryLinePayload) => updateInventoryLine(payload),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: inventoriesKeys.detail(payload.inventoryId) });
      await queryClient.invalidateQueries({ queryKey: inventoriesKeys.lists() });
    },
  });
}

export function useDeleteInventoryLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteInventoryLinePayload) => deleteInventoryLine(payload),
    onSuccess: async (_, payload) => {
      await queryClient.invalidateQueries({ queryKey: inventoriesKeys.detail(payload.inventoryId) });
      await queryClient.invalidateQueries({ queryKey: inventoriesKeys.lists() });
    },
  });
}

export function usePostInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inventoryId: string) => postInventory(inventoryId),
    onSuccess: async (_, inventoryId) => {
      await queryClient.invalidateQueries({ queryKey: inventoriesKeys.detail(inventoryId) });
      await queryClient.invalidateQueries({ queryKey: inventoriesKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: lotsKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: lotsKeys.byReceptions() });
    },
  });
}
