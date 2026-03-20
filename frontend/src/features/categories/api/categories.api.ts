import { api } from "@/shared/api/apiClient";
import type {
  CategoriesListParams,
  CategoriesListResponse,
  Category,
  CreateCategoryPayload,
  DeleteCategoryPayload,
  UpdateCategoryPayload,
} from "@/features/categories/api/categories.types";

export async function getCategories(params: CategoriesListParams): Promise<CategoriesListResponse> {
  const { page, pageSize } = params;
  const res = await api.get<CategoriesListResponse>("/api/categories", {
    params: {
      page,
      pageSize,
    },
  });
  return res.data;
}

export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  const res = await api.post<Category>("/api/categories", payload);
  return res.data;
}

export async function updateCategory(payload: UpdateCategoryPayload): Promise<void> {
  await api.put(`/api/categories/${payload.id}`, {
    name: payload.name,
  });
}

export async function deleteCategory(payload: DeleteCategoryPayload): Promise<void> {
  await api.delete(`/api/categories/${payload.id}`);
}
