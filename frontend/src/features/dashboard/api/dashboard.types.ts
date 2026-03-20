export type DashboardSummaryDto = {
  stockUsableValue: number;
  stockExpiredValue: number;
  stockTotalValue: number;
  wasteValue: number;
  wasteQty: number;
  receptionsValue: number | null;
  wasteRate: number | null;
  inventoryVarianceValue: number;
};

export type WasteTrendPointDto = {
  date: string;
  wasteValue: number;
  wasteQty: number;
};

export type TopWasteProductDto = {
  productId: string;
  productName: string;
  totalWasteQty: number;
  totalWasteValue: number;
};

export type LowStockProductAlertDto = {
  productId: string;
  productName: string;
  alertThreshold: number;
  quantityRemaining: number;
};

export type LotAlertDto = {
  lotId: string;
  productId: string;
  productName: string;
  lotCode?: string | null;
  expiryDate: string;
  quantityRemaining: number;
};

export type DashboardAlertsDto = {
  lowStockProducts: LowStockProductAlertDto[];
  expiringLots: LotAlertDto[];
  expiredLots: LotAlertDto[];
  expiredStockValue: number;
};

export type DashboardSummaryParams = {
  from?: string;
  to?: string;
};

export type DashboardWasteTrendParams = {
  days: number;
};

export type DashboardTopWasteProductsParams = {
  from?: string;
  to?: string;
  limit?: number;
};

export type DashboardAlertsParams = {
  expiryDays: number;
};
