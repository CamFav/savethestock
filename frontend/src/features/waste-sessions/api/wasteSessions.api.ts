import { api } from "@/shared/api/apiClient";
import type {
  AddWasteLinePayload,
  CreateWasteSessionPayload,
  DeleteWasteLinePayload,
  DeleteWasteSessionPayload,
  ExportWasteSessionsCsvParams,
  UpdateWasteLinePayload,
  WasteLine,
  WasteSession,
  WasteSessionsListParams,
  WasteSessionsListResponse,
} from "@/features/waste-sessions/api/wasteSessions.types";

type BackendWasteLine = {
  id: string;
  companyId: string;
  wasteSessionId: string;
  lotId: string;
  quantity: number;
  reason: string;
};

type BackendWasteSession = {
  id: string;
  companyId: string;
  accountId: string;
  wasteDate: string;
  status: string;
  comment?: string | null;
  createdAt: string;
  postedByName?: string | null;
  lines?: BackendWasteLine[];
};

type BackendPagedWasteSessionResponse = {
  items: BackendWasteSession[];
  page: number;
  pageSize: number;
  total: number;
};

function mapWasteLine(item: BackendWasteLine): WasteLine {
  return {
    id: item.id,
    companyId: item.companyId,
    wasteSessionId: item.wasteSessionId,
    lotId: item.lotId,
    quantity: item.quantity,
    reason: item.reason,
  };
}

function mapWasteSession(item: BackendWasteSession): WasteSession {
  return {
    id: item.id,
    companyId: item.companyId,
    accountId: item.accountId,
    wasteDate: item.wasteDate,
    status: item.status,
    comment: item.comment ?? undefined,
    createdAt: item.createdAt,
    postedByName: item.postedByName ?? undefined,
    lines: (item.lines ?? []).map(mapWasteLine),
  };
}

export async function listWasteSessions(params: WasteSessionsListParams): Promise<WasteSessionsListResponse> {
  const res = await api.get<BackendPagedWasteSessionResponse>("/api/waste-sessions", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      from: params.from,
      to: params.to,
      status: params.status,
      productId: params.productId,
      reason: params.reason,
    },
  });

  return {
    items: res.data.items.map(mapWasteSession),
    page: res.data.page,
    pageSize: res.data.pageSize,
    total: res.data.total,
  };
}

export async function getWasteSession(id: string): Promise<WasteSession> {
  const res = await api.get<BackendWasteSession>(`/api/waste-sessions/${id}`);
  return mapWasteSession(res.data);
}

export async function createWasteSession(payload: CreateWasteSessionPayload): Promise<WasteSession> {
  const res = await api.post<BackendWasteSession>("/api/waste-sessions", {
    wasteDate: payload.wasteDate,
    comment: payload.comment ?? null,
  });

  return mapWasteSession(res.data);
}

export async function addWasteLine(sessionId: string, payload: AddWasteLinePayload): Promise<WasteLine> {
  const res = await api.post<BackendWasteLine>(`/api/waste-sessions/${sessionId}/lines`, payload);
  return mapWasteLine(res.data);
}

export async function updateWasteLine(payload: UpdateWasteLinePayload): Promise<void> {
  await api.put(`/api/waste-sessions/${payload.sessionId}/lines/${payload.lineId}`, {
    quantity: payload.quantity,
    reason: payload.reason,
  });
}

export async function deleteWasteLine(payload: DeleteWasteLinePayload): Promise<void> {
  await api.delete(`/api/waste-sessions/${payload.sessionId}/lines/${payload.lineId}`);
}

export async function deleteWasteSession(payload: DeleteWasteSessionPayload): Promise<void> {
  await api.delete(`/api/waste-sessions/${payload.id}`);
}

export async function postWasteSession(sessionId: string): Promise<void> {
  await api.post(`/api/waste-sessions/${sessionId}/post`);
}

export async function exportWasteSessionsCsv(params: ExportWasteSessionsCsvParams): Promise<Blob> {
  const res = await api.get("/api/waste-sessions/export", {
    responseType: "blob",
    params: {
      from: params.from,
      to: params.to,
      status: params.status,
      productId: params.productId,
      reason: params.reason,
      format: "csv",
    },
  });

  return res.data as Blob;
}
