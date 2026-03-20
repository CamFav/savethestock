export type WasteLine = {
  id: string;
  companyId: string;
  wasteSessionId: string;
  lotId: string;
  quantity: number;
  reason: string;
};

export type WasteSession = {
  id: string;
  companyId: string;
  accountId: string;
  wasteDate: string;
  status: string;
  comment?: string;
  createdAt: string;
  postedByName?: string;
  lines: WasteLine[];
};

export type WasteSessionsListParams = {
  page: number;
  pageSize: number;
  from?: string;
  to?: string;
  status?: string;
  productId?: string;
  reason?: string;
};

export type WasteSessionsListResponse = {
  items: WasteSession[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateWasteSessionPayload = {
  wasteDate: string;
  comment?: string;
};

export type AddWasteLinePayload = {
  lotId: string;
  quantity: number;
  reason: string;
};

export type UpdateWasteLinePayload = {
  sessionId: string;
  lineId: string;
  quantity: number;
  reason: string;
};

export type DeleteWasteLinePayload = {
  sessionId: string;
  lineId: string;
};

export type DeleteWasteSessionPayload = {
  id: string;
};

export type ExportWasteSessionsCsvParams = {
  from?: string;
  to?: string;
  status?: string;
  productId?: string;
  reason?: string;
};
