import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addOrderLine,
  addProductToDraftOrder,
  cancelOrder,
  createDraftOrder,
  deleteOrder,
  getOrderById,
  getOrders,
  recordOrderReception,
  removeOrderLine,
  sendOrder,
  updateOrder,
  updateOrderLine,
} from "@/features/orders/api/orders.api";
import { ordersKeys } from "@/features/orders/api/orders.keys";
import { receptionsKeys } from "@/features/receptions/api/receptions.keys";
import type {
  AddProductToOrderInput,
  OrderLineAddRequest,
  OrderLineUpdateRequest,
  OrderReceptionRecordRequest,
  OrdersListParams,
  OrderUpdateRequest,
} from "@/features/orders/orders.types";

const ORDERS_ALL_PARAMS: OrdersListParams = {
  page: 1,
  pageSize: 200,
};

async function invalidateOrders(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: ordersKeys.lists() });
  await queryClient.invalidateQueries({ queryKey: ordersKeys.details() });
}

export function useOrdersList(params: OrdersListParams) {
  return useQuery({
    queryKey: ordersKeys.list(params),
    queryFn: () => getOrders(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useOrdersAll() {
  return useOrdersList(ORDERS_ALL_PARAMS);
}

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ordersKeys.detail(id),
    queryFn: () => getOrderById(id),
    enabled: id.length > 0,
  });
}

export function useCreateDraftOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => createDraftOrder(),
    onSuccess: async (order) => {
      await invalidateOrders(queryClient);
      queryClient.setQueryData(ordersKeys.detail(order.id), order);
    },
  });
}

export function useAddProductToDraftOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddProductToOrderInput) => addProductToDraftOrder(payload),
    onSuccess: async (order) => {
      await invalidateOrders(queryClient);
      queryClient.setQueryData(ordersKeys.detail(order.id), order);
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OrderUpdateRequest) => updateOrder(payload),
    onSuccess: async (order) => {
      await invalidateOrders(queryClient);
      queryClient.setQueryData(ordersKeys.detail(order.id), order);
    },
  });
}

export function useAddOrderLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OrderLineAddRequest) => addOrderLine(payload),
    onSuccess: async (order) => {
      await invalidateOrders(queryClient);
      queryClient.setQueryData(ordersKeys.detail(order.id), order);
    },
  });
}

export function useUpdateOrderLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OrderLineUpdateRequest) => updateOrderLine(payload),
    onSuccess: async (order) => {
      await invalidateOrders(queryClient);
      queryClient.setQueryData(ordersKeys.detail(order.id), order);
    },
  });
}

export function useRemoveOrderLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { orderId: string; lineId: string }) => removeOrderLine(payload),
    onSuccess: async (order) => {
      await invalidateOrders(queryClient);
      queryClient.setQueryData(ordersKeys.detail(order.id), order);
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => deleteOrder(orderId),
    onSuccess: async () => {
      await invalidateOrders(queryClient);
    },
  });
}

export function useSendOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => sendOrder(orderId),
    onSuccess: async (order) => {
      await invalidateOrders(queryClient);
      queryClient.setQueryData(ordersKeys.detail(order.id), order);
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: async (order) => {
      await invalidateOrders(queryClient);
      queryClient.setQueryData(ordersKeys.detail(order.id), order);
    },
  });
}

export function useRecordOrderReception() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OrderReceptionRecordRequest) => recordOrderReception(payload),
    onSuccess: async (order) => {
      await invalidateOrders(queryClient);
      await queryClient.invalidateQueries({ queryKey: receptionsKeys.lists() });
      await queryClient.invalidateQueries({ queryKey: receptionsKeys.details() });
      queryClient.setQueryData(ordersKeys.detail(order.id), order);
    },
  });
}
