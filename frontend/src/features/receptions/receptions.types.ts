export type ReceptionListItem = {
  id: string;
  supplierId?: string;
  orderId?: string;
  supplierName?: string;
  receptionDate?: string;
  createdAt?: string;
  lotsCount?: number;
  reference?: string;
  status?: string;
};

export type ReceptionDetail = {
  id: string;
  supplierId?: string;
  orderId?: string;
  receptionDate?: string;
  createdAt?: string;
  reference?: string;
  status?: string;
  issueNote?: string;
  hasIssue?: boolean;
};

export type ReceptionsListParams = {
  page: number;
  pageSize: number;
};

export type ReceptionsListResponse = {
  items: ReceptionListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ReceptionCreateRequest = {
  supplierId: string;
  receptionDate: string;
  reference?: string;
  notes?: string;
};
