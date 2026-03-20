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
  productName: string;
  unit: string;
  quantity?: number;
  unitPrice?: number | null;
};
