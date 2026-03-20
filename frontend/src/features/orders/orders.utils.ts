import type { OrderRecord, OrderStatus } from "@/features/orders/orders.types";

export function getOrderStatusLabel(status: OrderStatus): string {
  if (status === "DRAFT") return "Brouillon";
  if (status === "SENT") return "Envoyée";
  if (status === "PARTIALLY_RECEIVED") return "Reçue partiellement";
  if (status === "RECEIVED") return "Reçue";
  return "Annulée";
}

export function getOrderStatusTone(status: OrderStatus): string {
  if (status === "DRAFT") return "border-slate-300 bg-slate-50 text-slate-700";
  if (status === "SENT") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "PARTIALLY_RECEIVED") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "RECEIVED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-red-200 bg-red-50 text-red-700";
}

export function formatOrderCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function formatOrderDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function getOrderEstimatedTotal(order: OrderRecord): number {
  return order.lines.reduce((sum, line) => sum + (line.unitPrice ?? 0) * line.quantityOrdered, 0);
}
