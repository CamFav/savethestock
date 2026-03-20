import { api } from "@/shared/api/apiClient";
import type {
  LotCreateRequest,
  LotListParams,
  LotDeleteRequest,
  LotListItem,
  LotUpdateRequest,
  LotsByReceptionParams,
  LotsListResponse,
} from "@/features/lots/lots.types";

type BackendLot = {
  id: string;
  productId: string;
  receptionId?: string | null;
  lotCode?: string | null;
  expiryDate?: string | null;
  unitCost?: number;
  quantityInitial: number;
  quantityRemaining?: number;
  hasIssue?: boolean;
  issueNote?: string | null;
  createdAt?: string;
};

type BackendPagedLotsResponse = {
  items: BackendLot[];
  total: number;
  page: number;
  pageSize: number;
};

function mapLot(item: BackendLot): LotListItem {
  return {
    id: item.id,
    productId: item.productId,
    receptionId: item.receptionId ?? undefined,
    quantityInitial: item.quantityInitial,
    quantityRemaining: item.quantityRemaining,
    unitCost: item.unitCost,
    hasIssue: item.hasIssue,
    issueNote: item.issueNote ?? undefined,
    createdAt: item.createdAt,
    lotCode: item.lotCode ?? undefined,
    expiryDate: item.expiryDate ?? undefined,
  };
}

function mapListResponse(data: BackendPagedLotsResponse): LotsListResponse {
  return {
    items: data.items.map(mapLot),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  };
}

export async function getLots(params: LotListParams): Promise<LotsListResponse> {
  const res = await api.get<BackendPagedLotsResponse>("/api/lots", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      productId: params.productId,
      receptionId: params.receptionId,
      // TODO(api): backend does not support q yet.
      q: params.q,
    },
  });

  return mapListResponse(res.data);
}

export async function getLotsByReception(params: LotsByReceptionParams): Promise<LotsListResponse> {
  return getLots({
    page: params.page,
    pageSize: params.pageSize,
    receptionId: params.receptionId,
  });
}

export async function createLot(payload: LotCreateRequest): Promise<LotListItem> {
  const res = await api.post<BackendLot>("/api/lots", {
    productId: payload.productId,
    receptionId: payload.receptionId ?? null,
    lotCode: payload.lotCode || null,
    expiryDate: payload.expiryDate || null,
    unitCost: payload.unitCost ?? 0,
    quantityInitial: payload.quantityInitial,
  });

  return mapLot(res.data);
}

export async function updateLot(payload: LotUpdateRequest): Promise<void> {
  await api.put(`/api/lots/${payload.id}`, {
    receptionId: payload.receptionId ?? null,
    lotCode: payload.lotCode || null,
    expiryDate: payload.expiryDate || null,
    unitCost: payload.unitCost ?? 0,
    hasIssue: payload.hasIssue,
    issueNote: payload.issueNote || null,
  });
}

export async function deleteLot(payload: LotDeleteRequest): Promise<void> {
  await api.delete(`/api/lots/${payload.id}`);
}
