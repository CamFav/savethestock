import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "@/features/products/api/products.api";
import { productsKeys } from "@/features/products/api/products.keys";
import type {
  CreateProductPayload,
  DeleteProductPayload,
  ProductsListParams,
  UpdateProductPayload,
} from "@/features/products/api/products.types";

const PRODUCTS_ALL_PARAMS: ProductsListParams = {
  page: 1,
  pageSize: 200,
};

export function useProductsList(params: ProductsListParams) {
  return useQuery({
    queryKey: productsKeys.list(params),
    queryFn: () => getProducts(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useProductsAll() {
  return useProductsList(PRODUCTS_ALL_PARAMS);
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProductPayload) => updateProduct(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DeleteProductPayload) => deleteProduct(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
    },
  });
}
