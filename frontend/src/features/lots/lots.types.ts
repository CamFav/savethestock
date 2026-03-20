export type LotListItem = {
  id: string;
  productId: string;
  productName?: string;
  receptionId?: string;
  lotCode?: string;
  expiryDate?: string;
  unitCost?: number;
  quantityInitial: number;
  quantityRemaining?: number;
  hasIssue?: boolean;
  issueNote?: string;
  createdAt?: string;
};

export type LotListParams = {
  page: number;
  pageSize: number;
  productId?: string;
  receptionId?: string;
  q?: string;
};

export type LotsByReceptionParams = {
  receptionId: string;
  page: number;
  pageSize: number;
};

export type LotsListResponse = {
  items: LotListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type LotCreateRequest = {
  productId: string;
  quantityInitial: number;
  receptionId?: string;
  lotCode?: string;
  expiryDate?: string;
  unitCost?: number;
  hasIssue?: boolean;
  issueNote?: string;
};

export type LotDeleteRequest = {
  id: string;
  receptionId?: string;
};

export type LotUpdateRequest = {
  id: string;
  receptionId?: string;
  lotCode?: string;
  expiryDate?: string;
  unitCost?: number;
  hasIssue: boolean;
  issueNote?: string;
};
