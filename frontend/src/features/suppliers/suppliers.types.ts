export type SupplierListItem = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt?: string;
};

export type SuppliersListParams = {
  page: number;
  pageSize: number;
  q?: string;
};

export type SuppliersListResponse = {
  items: SupplierListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type SupplierCreateRequest = {
  name: string;
  email?: string;
  phone?: string;
};

export type SupplierUpdateRequest = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

export type SupplierDeleteRequest = {
  id: string;
};

export type SupplierFormValues = {
  name: string;
  email: string;
  phone: string;
};
