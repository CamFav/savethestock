import { api } from "@/shared/api/apiClient";
import type {
  ReceptionCreateRequest,
  ReceptionDetail,
  ReceptionListItem,
  ReceptionsListParams,
  ReceptionsListResponse,
} from "@/features/receptions/receptions.types";

type BackendReception = {
  id: string;
  supplierId?: string | null;
  receptionDate?: string;
  reference?: string | null;
  status?: string;
  createdAt?: string;
  hasIssue?: boolean;
  issueNote?: string | null;
};

type BackendPagedReceptionsResponse = {
  items: BackendReception[];
  total: number;
  page: number;
  pageSize: number;
};

function mapReception(item: BackendReception): ReceptionListItem {
  return {
    id: item.id,
    supplierId: item.supplierId ?? undefined,
    receptionDate: item.receptionDate,
    createdAt: item.createdAt,
    reference: item.reference ?? undefined,
    status: item.status,
  };
}

function mapReceptionDetail(item: BackendReception): ReceptionDetail {
  return {
    id: item.id,
    supplierId: item.supplierId ?? undefined,
    receptionDate: item.receptionDate,
    createdAt: item.createdAt,
    reference: item.reference ?? undefined,
    status: item.status,
    hasIssue: item.hasIssue,
    issueNote: item.issueNote ?? undefined,
  };
}

function mapListResponse(data: BackendPagedReceptionsResponse): ReceptionsListResponse {
  return {
    items: data.items.map(mapReception),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  };
}

export async function getReceptions(params: ReceptionsListParams): Promise<ReceptionsListResponse> {
  const res = await api.get<BackendPagedReceptionsResponse>("/api/receptions", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
    },
  });

  return mapListResponse(res.data);
}

export async function createReception(payload: ReceptionCreateRequest): Promise<ReceptionListItem> {
  const res = await api.post<BackendReception>("/api/receptions", {
    receptionDate: payload.receptionDate,
    reference: payload.reference || null,
    hasIssue: false,
    issueNote: payload.notes || null,
    supplierId: payload.supplierId,
  });

  return mapReception(res.data);
}

export async function getReceptionById(id: string): Promise<ReceptionDetail> {
  const res = await api.get<BackendReception>(`/api/receptions/${id}`);
  return mapReceptionDetail(res.data);
}
