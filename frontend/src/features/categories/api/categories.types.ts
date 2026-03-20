export type Category = {
  id: string;
  companyId: string;
  name: string;
  createdAt: string;
};

export type CategoriesListParams = {
  page: number;
  pageSize: number;
  q?: string;
};

export type CategoriesListResponse = {
  items: Category[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateCategoryPayload = {
  name: string;
};

export type UpdateCategoryPayload = {
  id: string;
  name: string;
};

export type DeleteCategoryPayload = {
  id: string;
};
