import type { SuppliersListParams } from "@/features/suppliers/suppliers.types";

export const suppliersKeys = {
  all: ["suppliers"] as const,
  lists: () => [...suppliersKeys.all, "list"] as const,
  list: (params: SuppliersListParams) => [...suppliersKeys.lists(), params] as const,
  details: () => [...suppliersKeys.all, "detail"] as const,
  detail: (id: string) => [...suppliersKeys.details(), id] as const,
};
