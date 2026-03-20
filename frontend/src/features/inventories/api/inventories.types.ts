export type InventoryLine = {
  id: string;
  companyId: string;
  inventoryId: string;
  productId: string;
  theoreticalQuantity: number;
  realQuantity: number;
};

export type Inventory = {
  id: string;
  companyId: string;
  accountId: string;
  inventoryDate: string;
  status: string;
  comment?: string;
  createdAt: string;
  postedByName?: string;
  lines: InventoryLine[];
};

export type InventoriesListParams = {
  page: number;
  pageSize: number;
  from?: string;
  to?: string;
  status?: string;
  productId?: string;
};

export type InventoriesListResponse = {
  items: Inventory[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateInventoryPayload = {
  inventoryDate: string;
  comment?: string;
};

export type UpsertInventoryLinePayload = {
  productId: string;
  realQuantity: number;
};

export type UpdateInventoryLinePayload = {
  inventoryId: string;
  lineId: string;
  realQuantity: number;
};

export type DeleteInventoryLinePayload = {
  inventoryId: string;
  lineId: string;
};

export type ExportInventoriesCsvParams = {
  from?: string;
  to?: string;
  status?: string;
  productId?: string;
};
