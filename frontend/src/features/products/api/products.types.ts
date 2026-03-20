export type Product = {
  id: string;
  companyId: string;
  categoryId: string;
  name: string;
  unit: string;
  alertThreshold: number;
  minimumStock?: number;
  isActive: boolean;
  createdAt: string;
};

export type ProductsListParams = {
  page: number;
  pageSize: number;
  q?: string;
  categoryId?: string;
};

export type ProductsListResponse = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateProductPayload = {
  categoryId: string;
  name: string;
  unit: string;
  alertThreshold: number;
  isActive: boolean;
};

export type UpdateProductPayload = {
  id: string;
  categoryId: string;
  name: string;
  unit: string;
  alertThreshold: number;
  isActive: boolean;
};

export type DeleteProductPayload = {
  id: string;
};
