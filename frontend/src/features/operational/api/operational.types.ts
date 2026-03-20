export type OperationalLotItemDto = {
  lotId: string;
  lotCode?: string | null;
  productId: string;
  productName: string;
  expiryDate: string;
  remainingQty: number;
  unitCost: number;
  remainingValue: number;
};

export type OperationalLowStockProductDto = {
  productId: string;
  productName: string;
  currentQty: number;
  alertThreshold: number;
};

export type OperationalQuickStatsDto = {
  expiringCount: number;
  expiredCount: number;
  lowStockCount: number;
};

export type OperationalTodayDto = {
  expiringLots: OperationalLotItemDto[];
  expiredLots: OperationalLotItemDto[];
  lowStockProducts: OperationalLowStockProductDto[];
  quickStats: OperationalQuickStatsDto;
};

export type OperationalTodayParams = {
  expiryDays?: number;
  lowStockOnly?: boolean;
};
