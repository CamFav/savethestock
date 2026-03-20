import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "@/features/suppliers/api/suppliers.api";
import { suppliersKeys } from "@/features/suppliers/api/suppliers.keys";
import type {
  SupplierCreateRequest,
  SupplierDeleteRequest,
  SupplierUpdateRequest,
  SuppliersListParams,
} from "@/features/suppliers/suppliers.types";

const SUPPLIERS_ALL_PARAMS: SuppliersListParams = {
  page: 1,
  pageSize: 200,
};

export function useSuppliersList(params: SuppliersListParams) {
  return useQuery({
    queryKey: suppliersKeys.list(params),
    queryFn: () => getSuppliers(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useSuppliersAll() {
  return useSuppliersList(SUPPLIERS_ALL_PARAMS);
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SupplierCreateRequest) => createSupplier(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SupplierUpdateRequest) => updateSupplier(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SupplierDeleteRequest) => deleteSupplier(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: suppliersKeys.lists() });
    },
  });
}
