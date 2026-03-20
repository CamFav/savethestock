import { create } from "zustand";
import type { AddProductToOrderInput, OrderLine, OrderRecord, OrderStatus } from "@/features/orders/orders.types";

type OrdersState = {
  orders: OrderRecord[];
  createDraftOrder: () => string;
  addProductToDraftOrder: (input: AddProductToOrderInput) => string;
  updateOrderMeta: (orderId: string, patch: { supplierId?: string; orderDate?: string; notes?: string }) => void;
  updateOrderLine: (orderId: string, lineId: string, patch: { quantityOrdered?: number; unitPrice?: number | null }) => void;
  addLineToOrder: (orderId: string, line: AddProductToOrderInput) => void;
  removeOrderLine: (orderId: string, lineId: string) => void;
  deleteOrder: (orderId: string) => void;
  markOrderAsSent: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  attachReceptionToOrder: (orderId: string, receptionId: string) => void;
  recordOrderReception: (orderId: string, payload: { receptionId: string; receivedByProductId: Record<string, number> }) => void;
};

const STORAGE_KEY = "savethestock.orders.v1";

function getNowIso(): string {
  return new Date().toISOString();
}

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildReference(orderCount: number): string {
  const today = new Date();
  const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  return `CMD-${datePart}-${String(orderCount + 1).padStart(3, "0")}`;
}

function loadOrders(): OrderRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as OrderRecord[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((order) => ({
      ...order,
      receptionIds: Array.isArray(order.receptionIds) ? order.receptionIds : [],
      lines: Array.isArray(order.lines)
        ? order.lines.map((line) => ({
            ...line,
            quantityReceived: Number.isFinite(line.quantityReceived) ? Math.max(line.quantityReceived, 0) : 0,
          }))
        : [],
    }));
  } catch {
    return [];
  }
}

function persistOrders(orders: OrderRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function createEmptyOrder(orderCount: number): OrderRecord {
  const now = getNowIso();

  return {
    id: buildId("order"),
    reference: buildReference(orderCount),
    orderDate: getTodayIso(),
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    receptionIds: [],
    lines: [],
  };
}

function sortOrders(orders: OrderRecord[]): OrderRecord[] {
  return [...orders].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function updateOrders(updater: (orders: OrderRecord[]) => OrderRecord[]): (state: OrdersState) => Partial<OrdersState> {
  return (state) => {
    const nextOrders = sortOrders(updater(state.orders));
    persistOrders(nextOrders);
    return { orders: nextOrders };
  };
}

function buildLine(input: AddProductToOrderInput): OrderLine {
  return {
    id: buildId("line"),
    productId: input.productId,
    productName: input.productName,
    unit: input.unit,
    quantityOrdered: Math.max(input.quantity ?? 1, 1),
    quantityReceived: 0,
    unitPrice: input.unitPrice ?? null,
  };
}

function getStatusFromLines(order: OrderRecord): OrderStatus {
  if (order.status === "CANCELLED") {
    return "CANCELLED";
  }

  const totalOrdered = order.lines.reduce((sum, line) => sum + line.quantityOrdered, 0);
  const totalReceived = order.lines.reduce((sum, line) => sum + Math.min(line.quantityReceived, line.quantityOrdered), 0);

  if (totalOrdered > 0 && totalReceived >= totalOrdered) {
    return "RECEIVED";
  }

  if (totalReceived > 0) {
    return "PARTIALLY_RECEIVED";
  }

  return order.status;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: sortOrders(loadOrders()),

  createDraftOrder: () => {
    const newOrder = createEmptyOrder(get().orders.length);
    set(updateOrders((orders) => [newOrder, ...orders]));
    return newOrder.id;
  },

  addProductToDraftOrder: (input) => {
    const existingDraft = sortOrders(get().orders).find((order) => order.status === "DRAFT");
    const draftOrderId = existingDraft?.id ?? get().createDraftOrder();

    set(
      updateOrders((orders) =>
        orders.map((order) => {
          if (order.id !== draftOrderId) {
            return order;
          }

          const existingLine = order.lines.find((line) => line.productId === input.productId);
          const updatedAt = getNowIso();

          if (existingLine) {
            return {
              ...order,
              updatedAt,
              lines: order.lines.map((line) =>
                line.productId === input.productId
                  ? {
                      ...line,
                      quantityOrdered: line.quantityOrdered + Math.max(input.quantity ?? 1, 1),
                      unitPrice: input.unitPrice ?? line.unitPrice,
                    }
                  : line,
              ),
            };
          }

          return {
            ...order,
            updatedAt,
            lines: [...order.lines, buildLine(input)],
          };
        }),
      ),
    );

    return draftOrderId;
  },

  updateOrderMeta: (orderId, patch) => {
    set(
      updateOrders((orders) =>
        orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                ...patch,
                updatedAt: getNowIso(),
              }
            : order,
        ),
      ),
    );
  },

  updateOrderLine: (orderId, lineId, patch) => {
    set(
      updateOrders((orders) =>
        orders.map((order) =>
          order.id === orderId
            ? (() => {
                const nextOrder = {
                  ...order,
                  updatedAt: getNowIso(),
                  lines: order.lines.map((line) =>
                    line.id === lineId
                      ? {
                          ...line,
                          quantityOrdered: Math.max(patch.quantityOrdered ?? line.quantityOrdered, 1),
                          unitPrice: patch.unitPrice === undefined ? line.unitPrice : patch.unitPrice,
                        }
                      : line,
                  ),
                };

                return {
                  ...nextOrder,
                  status: getStatusFromLines(nextOrder),
                };
              })()
            : order,
        ),
      ),
    );
  },

  addLineToOrder: (orderId, line) => {
    set(
      updateOrders((orders) =>
        orders.map((order) =>
          order.id === orderId
            ? (() => {
                const nextOrder = {
                  ...order,
                  updatedAt: getNowIso(),
                  lines: [...order.lines, buildLine(line)],
                };

                return {
                  ...nextOrder,
                  status: getStatusFromLines(nextOrder),
                };
              })()
            : order,
        ),
      ),
    );
  },

  removeOrderLine: (orderId, lineId) => {
    set(
      updateOrders((orders) =>
        orders.map((order) =>
          order.id === orderId
            ? (() => {
                const nextOrder = {
                  ...order,
                  updatedAt: getNowIso(),
                  lines: order.lines.filter((line) => line.id !== lineId),
                };

                return {
                  ...nextOrder,
                  status: getStatusFromLines(nextOrder),
                };
              })()
            : order,
        ),
      ),
    );
  },

  deleteOrder: (orderId) => {
    set(updateOrders((orders) => orders.filter((order) => !(order.id === orderId && order.status === "DRAFT"))));
  },

  markOrderAsSent: (orderId) => {
    set(
      updateOrders((orders) =>
        orders.map((order) => {
          if (order.id !== orderId || order.status !== "DRAFT") {
            return order;
          }

          return {
            ...order,
            updatedAt: getNowIso(),
            status: "SENT",
          };
        }),
      ),
    );
  },

  cancelOrder: (orderId) => {
    set(
      updateOrders((orders) =>
        orders.map((order) => {
          if (order.id !== orderId || order.status !== "SENT") {
            return order;
          }

          return {
            ...order,
            updatedAt: getNowIso(),
            status: "CANCELLED",
          };
        }),
      ),
    );
  },

  attachReceptionToOrder: (orderId, receptionId) => {
    set(
      updateOrders((orders) =>
        orders.map((order) => {
          if (order.id !== orderId) {
            return order;
          }

          const nextReceptionIds = order.receptionIds.includes(receptionId) ? order.receptionIds : [...order.receptionIds, receptionId];
          const nextStatus = order.status === "SENT" || order.status === "DRAFT" ? "PARTIALLY_RECEIVED" : order.status;

          return {
            ...order,
            updatedAt: getNowIso(),
            receptionIds: nextReceptionIds,
            status: nextStatus,
          };
        }),
      ),
    );
  },

  recordOrderReception: (orderId, payload) => {
    set(
      updateOrders((orders) =>
        orders.map((order) => {
          if (order.id !== orderId) {
            return order;
          }

          const nextReceptionIds = order.receptionIds.includes(payload.receptionId)
            ? order.receptionIds
            : [...order.receptionIds, payload.receptionId];

          const nextOrder = {
            ...order,
            updatedAt: getNowIso(),
            receptionIds: nextReceptionIds,
            lines: order.lines.map((line) => {
              const receivedNow = payload.receivedByProductId[line.productId] ?? 0;
              if (receivedNow <= 0) {
                return line;
              }

              return {
                ...line,
                quantityReceived: Math.min(line.quantityOrdered, line.quantityReceived + receivedNow),
              };
            }),
          };

          return {
            ...nextOrder,
            status: getStatusFromLines(nextOrder),
          };
        }),
      ),
    );
  },
}));
