import type { InventoriesListParams } from "@/features/inventories/api/inventories.types";

export const inventoriesKeys = {
  all: ["inventories"] as const,
  lists: () => [...inventoriesKeys.all, "list"] as const,
  list: (params: InventoriesListParams) => [...inventoriesKeys.lists(), params] as const,
  details: () => [...inventoriesKeys.all, "detail"] as const,
  detail: (id: string) => [...inventoriesKeys.details(), id] as const,
};
