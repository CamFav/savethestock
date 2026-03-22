import { api } from "@/shared/api/apiClient";
import type {
  AddProductToOrderInput,
  OrderLineAddRequest,
  OrderLineUpdateRequest,
  OrderReceptionRecordRequest,
  OrderRecord,
  OrdersListParams,
  OrdersListResponse,
  OrderUpdateRequest,
} from "@/features/orders/orders.types";

type BackendOrderLine = {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice?: number | null;
};

type BackendOrder = {
  id: string;
  reference: string;
  orderDate: string;
  supplierId?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  receptionIds: string[];
  lines: BackendOrderLine[];
};

type BackendPagedOrdersResponse = {
  items: BackendOrder[];
  total: number;
  page: number;
  pageSize: number;
};

function mapOrder(item: BackendOrder): OrderRecord {
  return {
    id: item.id,
    reference: item.reference,
    orderDate: item.orderDate,
    supplierId: item.supplierId ?? undefined,
    status: item.status as OrderRecord["status"],
    notes: item.notes ?? undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    receptionIds: Array.isArray(item.receptionIds) ? item.receptionIds : [],
    lines: Array.isArray(item.lines)
      ? item.lines.map((line) => ({
          id: line.id,
          productId: line.productId,
          productName: line.productName,
          unit: line.unit,
          quantityOrdered: line.quantityOrdered,
          quantityReceived: line.quantityReceived,
          unitPrice: line.unitPrice ?? null,
        }))
      : [],
  };
}

function mapOrdersList(data: BackendPagedOrdersResponse): OrdersListResponse {
  return {
    items: data.items.map(mapOrder),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  };
}

export async function getOrders(params: OrdersListParams): Promise<OrdersListResponse> {
  const res = await api.get<BackendPagedOrdersResponse>("/api/orders", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
    },
  });

  return mapOrdersList(res.data);
}

export async function getOrderById(id: string): Promise<OrderRecord> {
  const res = await api.get<BackendOrder>(`/api/orders/${id}`);
  return mapOrder(res.data);
}

export async function createDraftOrder(): Promise<OrderRecord> {
  const res = await api.post<BackendOrder>("/api/orders");
  return mapOrder(res.data);
}

export async function addProductToDraftOrder(payload: AddProductToOrderInput): Promise<OrderRecord> {
  const res = await api.post<BackendOrder>("/api/orders/draft/lines", {
    productId: payload.productId,
    quantity: payload.quantity ?? 1,
    unitPrice: payload.unitPrice ?? null,
  });
  return mapOrder(res.data);
}

export async function updateOrder(payload: OrderUpdateRequest): Promise<OrderRecord> {
  const res = await api.put<BackendOrder>(`/api/orders/${payload.id}`, {
    supplierId: payload.supplierId ?? null,
    orderDate: payload.orderDate,
    notes: payload.notes ?? null,
  });
  return mapOrder(res.data);
}

export async function addOrderLine(payload: OrderLineAddRequest): Promise<OrderRecord> {
  const res = await api.post<BackendOrder>(`/api/orders/${payload.orderId}/lines`, {
    productId: payload.productId,
    quantity: payload.quantity ?? 1,
    unitPrice: payload.unitPrice ?? null,
  });
  return mapOrder(res.data);
}

export async function updateOrderLine(payload: OrderLineUpdateRequest): Promise<OrderRecord> {
  const res = await api.put<BackendOrder>(`/api/orders/${payload.orderId}/lines/${payload.lineId}`, {
    quantityOrdered: payload.quantityOrdered,
    unitPrice: payload.unitPrice ?? null,
  });
  return mapOrder(res.data);
}

export async function removeOrderLine(payload: { orderId: string; lineId: string }): Promise<OrderRecord> {
  const res = await api.delete<BackendOrder>(`/api/orders/${payload.orderId}/lines/${payload.lineId}`);
  return mapOrder(res.data);
}

export async function deleteOrder(orderId: string): Promise<void> {
  await api.delete(`/api/orders/${orderId}`);
}

export async function sendOrder(orderId: string): Promise<OrderRecord> {
  const res = await api.post<BackendOrder>(`/api/orders/${orderId}/send`);
  return mapOrder(res.data);
}

export async function cancelOrder(orderId: string): Promise<OrderRecord> {
  const res = await api.post<BackendOrder>(`/api/orders/${orderId}/cancel`);
  return mapOrder(res.data);
}

export async function recordOrderReception(payload: OrderReceptionRecordRequest): Promise<OrderRecord> {
  const res = await api.post<BackendOrder>(`/api/orders/${payload.orderId}/receptions`, {
    receptionId: payload.receptionId,
    lines: payload.lines,
  });
  return mapOrder(res.data);
}
