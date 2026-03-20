import type {
  DashboardAlertsParams,
  DashboardSummaryParams,
  DashboardTopWasteProductsParams,
  DashboardWasteTrendParams,
} from "@/features/dashboard/api/dashboard.types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summaries: () => [...dashboardKeys.all, "summary"] as const,
  summary: (params: DashboardSummaryParams) => [...dashboardKeys.summaries(), params] as const,
  trends: () => [...dashboardKeys.all, "waste-trend"] as const,
  trend: (params: DashboardWasteTrendParams) => [...dashboardKeys.trends(), params] as const,
  topWasteProducts: () => [...dashboardKeys.all, "top-waste-products"] as const,
  topWasteProductList: (params: DashboardTopWasteProductsParams) => [...dashboardKeys.topWasteProducts(), params] as const,
  alerts: () => [...dashboardKeys.all, "alerts"] as const,
  alertsByExpiry: (params: DashboardAlertsParams) => [...dashboardKeys.alerts(), params] as const,
};

