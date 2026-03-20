import { api } from "@/shared/api/apiClient";
import type {
  DashboardAlertsDto,
  DashboardAlertsParams,
  DashboardSummaryDto,
  DashboardSummaryParams,
  DashboardTopWasteProductsParams,
  DashboardWasteTrendParams,
  TopWasteProductDto,
  WasteTrendPointDto,
} from "@/features/dashboard/api/dashboard.types";

function pickNumber(
  data: Record<string, unknown>,
  keys: string[],
  field: string,
  fallback?: number,
): number {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  if (typeof fallback === "number") {
    return fallback;
  }

  throw new Error(`invalid_dashboard_payload_${field}`);
}

function pickNullableNumber(
  data: Record<string, unknown>,
  keys: string[],
  field: string,
): number | null {
  for (const key of keys) {
    const value = data[key];
    if (value === null) return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }

  throw new Error(`invalid_dashboard_payload_${field}`);
}

export async function getDashboardSummary(params: DashboardSummaryParams): Promise<DashboardSummaryDto> {
  const res = await api.get<DashboardSummaryDto>("/api/dashboard/summary", {
    params: {
      from: params.from,
      to: params.to,
    },
  });

  const data = res.data as unknown as Record<string, unknown>;
  const stockUsableValue = pickNumber(
    data,
    ["stockUsableValue", "StockUsableValue", "stockTotalValue", "StockTotalValue"],
    "stockUsableValue",
  );
  const stockExpiredValue = pickNumber(data, ["stockExpiredValue", "StockExpiredValue"], "stockExpiredValue", 0);
  const stockTotalValue = pickNumber(
    data,
    ["stockTotalValue", "StockTotalValue"],
    "stockTotalValue",
    stockUsableValue + stockExpiredValue,
  );

  return {
    stockUsableValue,
    stockExpiredValue,
    stockTotalValue,
    wasteValue: pickNumber(data, ["wasteValue", "WasteValue"], "wasteValue"),
    wasteQty: pickNumber(data, ["wasteQty", "WasteQty"], "wasteQty"),
    receptionsValue: pickNullableNumber(data, ["receptionsValue", "ReceptionsValue"], "receptionsValue"),
    wasteRate: pickNullableNumber(data, ["wasteRate", "WasteRate"], "wasteRate"),
    inventoryVarianceValue: pickNumber(data, ["inventoryVarianceValue", "InventoryVarianceValue"], "inventoryVarianceValue", 0),
  };
}

export async function getWasteTrend(params: DashboardWasteTrendParams): Promise<WasteTrendPointDto[]> {
  const res = await api.get<WasteTrendPointDto[]>("/api/dashboard/waste-trend", {
    params: {
      days: params.days,
    },
  });

  return res.data;
}

export async function getTopWasteProducts(params: DashboardTopWasteProductsParams): Promise<TopWasteProductDto[]> {
  const res = await api.get<TopWasteProductDto[]>("/api/dashboard/top-waste-products", {
    params: {
      from: params.from,
      to: params.to,
      limit: params.limit ?? 5,
    },
  });

  return res.data;
}

export async function getDashboardAlerts(params: DashboardAlertsParams): Promise<DashboardAlertsDto> {
  const res = await api.get<DashboardAlertsDto>("/api/dashboard/alerts", {
    params: {
      expiryDays: params.expiryDays,
    },
  });

  const data = res.data as unknown as Record<string, unknown>;
  return {
    lowStockProducts: ((data.lowStockProducts ?? data.LowStockProducts) as DashboardAlertsDto["lowStockProducts"]) ?? [],
    expiringLots: ((data.expiringLots ?? data.ExpiringLots) as DashboardAlertsDto["expiringLots"]) ?? [],
    expiredLots: ((data.expiredLots ?? data.ExpiredLots) as DashboardAlertsDto["expiredLots"]) ?? [],
    expiredStockValue: pickNumber(data, ["expiredStockValue", "ExpiredStockValue"], "expiredStockValue", 0),
  };
}
