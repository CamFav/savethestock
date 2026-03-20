import { api } from "@/shared/api/apiClient";
import type {
  CreateInventoryPayload,
  DeleteInventoryLinePayload,
  ExportInventoriesCsvParams,
  InventoriesListParams,
  InventoriesListResponse,
  Inventory,
  InventoryLine,
  UpdateInventoryLinePayload,
  UpsertInventoryLinePayload,
} from "@/features/inventories/api/inventories.types";

type BackendInventoryLine = {
  id: string;
  companyId: string;
  inventoryId: string;
  productId: string;
  theoreticalQuantity: number;
  realQuantity: number;
};

type BackendInventory = {
  id: string;
  companyId: string;
  accountId: string;
  inventoryDate: string;
  status: string;
  comment?: string | null;
  createdAt: string;
  postedByName?: string | null;
  lines?: BackendInventoryLine[];
};

type BackendPagedInventoryResponse = {
  items: BackendInventory[];
  page: number;
  pageSize: number;
  total: number;
};

function mapInventoryLine(item: BackendInventoryLine): InventoryLine {
  return {
    id: item.id,
    companyId: item.companyId,
    inventoryId: item.inventoryId,
    productId: item.productId,
    theoreticalQuantity: item.theoreticalQuantity,
    realQuantity: item.realQuantity,
  };
}

function mapInventory(item: BackendInventory): Inventory {
  return {
    id: item.id,
    companyId: item.companyId,
    accountId: item.accountId,
    inventoryDate: item.inventoryDate,
    status: item.status,
    comment: item.comment ?? undefined,
    createdAt: item.createdAt,
    postedByName: item.postedByName ?? undefined,
    lines: (item.lines ?? []).map(mapInventoryLine),
  };
}

export async function listInventories(params: InventoriesListParams): Promise<InventoriesListResponse> {
  const res = await api.get<BackendPagedInventoryResponse>("/api/inventories", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      from: params.from,
      to: params.to,
      status: params.status,
      productId: params.productId,
    },
  });

  return {
    items: res.data.items.map(mapInventory),
    page: res.data.page,
    pageSize: res.data.pageSize,
    total: res.data.total,
  };
}

export async function getInventory(id: string): Promise<Inventory> {
  const res = await api.get<BackendInventory>(`/api/inventories/${id}`);
  return mapInventory(res.data);
}

export async function createInventory(payload: CreateInventoryPayload): Promise<Inventory> {
  const res = await api.post<BackendInventory>("/api/inventories", {
    inventoryDate: payload.inventoryDate,
    comment: payload.comment ?? null,
  });

  return mapInventory(res.data);
}

export async function upsertInventoryLine(inventoryId: string, payload: UpsertInventoryLinePayload): Promise<InventoryLine> {
  const res = await api.post<BackendInventoryLine>(`/api/inventories/${inventoryId}/lines`, payload);
  return mapInventoryLine(res.data);
}

export async function updateInventoryLine(payload: UpdateInventoryLinePayload): Promise<void> {
  await api.put(`/api/inventories/${payload.inventoryId}/lines/${payload.lineId}`, {
    realQuantity: payload.realQuantity,
  });
}

export async function deleteInventoryLine(payload: DeleteInventoryLinePayload): Promise<void> {
  await api.delete(`/api/inventories/${payload.inventoryId}/lines/${payload.lineId}`);
}

export async function postInventory(inventoryId: string): Promise<void> {
  await api.post(`/api/inventories/${inventoryId}/post`);
}

export async function exportInventoriesCsv(params: ExportInventoriesCsvParams): Promise<Blob> {
  const res = await api.get("/api/inventories/export", {
    responseType: "blob",
    params: {
      from: params.from,
      to: params.to,
      status: params.status,
      productId: params.productId,
      format: "csv",
    },
  });

  return res.data as Blob;
}
