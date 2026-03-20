import type { CategoriesListParams } from "@/features/categories/api/categories.types";

export const categoriesKeys = {
  all: ["categories"] as const,
  lists: () => [...categoriesKeys.all, "list"] as const,
  list: (params: CategoriesListParams) => [...categoriesKeys.lists(), params] as const,
  details: () => [...categoriesKeys.all, "detail"] as const,
  detail: (id: string) => [...categoriesKeys.details(), id] as const,
};
