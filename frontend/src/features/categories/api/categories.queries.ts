import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/features/categories/api/categories.api";
import { categoriesKeys } from "@/features/categories/api/categories.keys";
import type {
  CategoriesListParams,
  CreateCategoryPayload,
  DeleteCategoryPayload,
  UpdateCategoryPayload,
} from "@/features/categories/api/categories.types";

export function useCategoriesList(params: CategoriesListParams) {
  return useQuery({
    queryKey: categoriesKeys.list(params),
    queryFn: () => getCategories(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCategoryPayload) => updateCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteCategoryPayload) => deleteCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() });
    },
  });
}
