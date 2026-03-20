import { api } from "@/shared/api/apiClient";
import type {
  CreateProductPayload,
  DeleteProductPayload,
  Product,
  ProductsListParams,
  ProductsListResponse,
  UpdateProductPayload,
} from "@/features/products/api/products.types";

export async function getProducts(params: ProductsListParams): Promise<ProductsListResponse> {
  const res = await api.get<ProductsListResponse>("/api/products", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      categoryId: params.categoryId,
      // TODO(api): backend currently ignores q, keep parameter for future support.
      q: params.q,
    },
  });

  return res.data;
}

export async function createProduct(payload: CreateProductPayload): Promise<Product> {
  const res = await api.post<Product>("/api/products", payload);
  return res.data;
}

export async function updateProduct(payload: UpdateProductPayload): Promise<Product> {
  const res = await api.put<Product>(`/api/products/${payload.id}`, {
    categoryId: payload.categoryId,
    name: payload.name,
    unit: payload.unit,
    alertThreshold: payload.alertThreshold,
    isActive: payload.isActive,
  });
  return res.data;
}

export async function deleteProduct(payload: DeleteProductPayload): Promise<void> {
  await api.delete(`/api/products/${payload.id}`);
}
