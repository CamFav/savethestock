import { useQuery } from "@tanstack/react-query";
import {
  getDashboardAlerts,
  getDashboardSummary,
  getTopWasteProducts,
  getWasteTrend,
} from "@/features/dashboard/api/dashboard.api";
import { dashboardKeys } from "@/features/dashboard/api/dashboard.keys";
import type {
  DashboardAlertsParams,
  DashboardSummaryParams,
  DashboardTopWasteProductsParams,
  DashboardWasteTrendParams,
} from "@/features/dashboard/api/dashboard.types";

export function useDashboardSummary(params: DashboardSummaryParams) {
  return useQuery({
    queryKey: dashboardKeys.summary(params),
    queryFn: () => getDashboardSummary(params),
  });
}

export function useDashboardWasteTrend(params: DashboardWasteTrendParams) {
  return useQuery({
    queryKey: dashboardKeys.trend(params),
    queryFn: () => getWasteTrend(params),
  });
}

export function useDashboardTopWasteProducts(params: DashboardTopWasteProductsParams) {
  return useQuery({
    queryKey: dashboardKeys.topWasteProductList(params),
    queryFn: () => getTopWasteProducts(params),
  });
}

export function useDashboardAlerts(params: DashboardAlertsParams) {
  return useQuery({
    queryKey: dashboardKeys.alertsByExpiry(params),
    queryFn: () => getDashboardAlerts(params),
  });
}

