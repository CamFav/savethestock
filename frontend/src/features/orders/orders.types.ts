export type OrderStatus = "DRAFT" | "SENT" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";

export type OrderLine = {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number | null;
};

export type OrderRecord = {
  id: string;
  reference: string;
  orderDate: string;
  supplierId?: string;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  receptionIds: string[];
  lines: OrderLine[];
};

export type AddProductToOrderInput = {
  productId: string;
  quantity?: number;
  unitPrice?: number | null;
};

export type OrdersListParams = {
  page: number;
  pageSize: number;
};

export type OrdersListResponse = {
  items: OrderRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type OrderUpdateRequest = {
  id: string;
  supplierId?: string;
  orderDate: string;
  notes?: string;
};

export type OrderLineUpdateRequest = {
  orderId: string;
  lineId: string;
  quantityOrdered: number;
  unitPrice?: number | null;
};

export type OrderLineAddRequest = {
  orderId: string;
  productId: string;
  quantity?: number;
  unitPrice?: number | null;
};

export type OrderReceptionRecordRequest = {
  orderId: string;
  receptionId: string;
  lines: Array<{
    productId: string;
    quantityReceived: number;
  }>;
};
