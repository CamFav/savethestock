import { api } from "@/shared/api/apiClient";
import type {
  SupplierCreateRequest,
  SupplierDeleteRequest,
  SupplierListItem,
  SupplierUpdateRequest,
  SuppliersListParams,
  SuppliersListResponse,
} from "@/features/suppliers/suppliers.types";

type BackendSupplier = {
  id: string;
  name: string;
};

type BackendSuppliersListResponse = {
  items: BackendSupplier[];
  total: number;
  page: number;
  pageSize: number;
};

function mapSupplier(item: BackendSupplier): SupplierListItem {
  return {
    id: item.id,
    name: item.name,
  };
}

function mapListResponse(data: BackendSuppliersListResponse): SuppliersListResponse {
  return {
    items: data.items.map(mapSupplier),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  };
}

export async function getSuppliers(params: SuppliersListParams): Promise<SuppliersListResponse> {
  const res = await api.get<BackendSuppliersListResponse>("/api/suppliers", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      // TODO(api): backend does not support search yet.
      q: params.q,
    },
  });

  return mapListResponse(res.data);
}

export async function createSupplier(payload: SupplierCreateRequest): Promise<SupplierListItem> {
  const res = await api.post<BackendSupplier>("/api/suppliers", {
    name: payload.name,
  });

  return mapSupplier(res.data);
}

export async function updateSupplier(payload: SupplierUpdateRequest): Promise<void> {
  await api.put(`/api/suppliers/${payload.id}`, {
    name: payload.name,
  });
}

export async function deleteSupplier(payload: SupplierDeleteRequest): Promise<void> {
  await api.delete(`/api/suppliers/${payload.id}`);
}
