import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export type UrlQueryFilters = {
  from: string;
  to: string;
  status: string;
  productId: string;
  categoryId: string;
  reason: string;
  q: string;
  sort: string;
  page: number;
  pageSize: number;
  expiringBefore: string;
  expired: boolean;
  lowStock: boolean;
};

type UseUrlQueryFiltersOptions = {
  defaultStatus?: string;
  defaultPage?: number;
  defaultPageSize?: number;
};

const DEFAULTS: UrlQueryFilters = {
  from: "",
  to: "",
  status: "all",
  productId: "",
  categoryId: "",
  reason: "",
  q: "",
  sort: "",
  page: 1,
  pageSize: 10,
  expiringBefore: "",
  expired: false,
  lowStock: false,
};

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parseBool(value: string | null): boolean {
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}

export function useUrlQueryFilters(options?: UseUrlQueryFiltersOptions) {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaults = useMemo(
    () => ({
      ...DEFAULTS,
      status: options?.defaultStatus ?? DEFAULTS.status,
      page: options?.defaultPage ?? DEFAULTS.page,
      pageSize: options?.defaultPageSize ?? DEFAULTS.pageSize,
    }),
    [options?.defaultPage, options?.defaultPageSize, options?.defaultStatus],
  );

  const filters = useMemo<UrlQueryFilters>(
    () => ({
      from: searchParams.get("from") ?? defaults.from,
      to: searchParams.get("to") ?? defaults.to,
      status: searchParams.get("status") ?? defaults.status,
      productId: searchParams.get("productId") ?? defaults.productId,
      categoryId: searchParams.get("categoryId") ?? defaults.categoryId,
      reason: searchParams.get("reason") ?? defaults.reason,
      q: searchParams.get("q") ?? defaults.q,
      sort: searchParams.get("sort") ?? defaults.sort,
      page: parsePositiveInt(searchParams.get("page"), defaults.page),
      pageSize: parsePositiveInt(searchParams.get("pageSize"), defaults.pageSize),
      expiringBefore: searchParams.get("expiringBefore") ?? defaults.expiringBefore,
      expired: parseBool(searchParams.get("expired")),
      lowStock: parseBool(searchParams.get("lowStock")),
    }),
    [defaults, searchParams],
  );

  const setFilters = useCallback(
    (patch: Partial<UrlQueryFilters>) => {
      const next = { ...filters, ...patch };
      const params = new URLSearchParams(searchParams);

      const write = (key: keyof UrlQueryFilters, value: string) => {
        if (!value) {
          params.delete(key);
          return;
        }
        params.set(key, value);
      };

      write("from", next.from);
      write("to", next.to);
      write("status", next.status === defaults.status ? "" : next.status);
      write("productId", next.productId);
      write("categoryId", next.categoryId);
      write("reason", next.reason);
      write("q", next.q);
      write("sort", next.sort);
      write("expiringBefore", next.expiringBefore);
      write("expired", next.expired ? "true" : "");
      write("lowStock", next.lowStock ? "true" : "");
      write("page", next.page === defaults.page ? "" : String(next.page));
      write("pageSize", next.pageSize === defaults.pageSize ? "" : String(next.pageSize));

      setSearchParams(params, { replace: true });
    },
    [defaults.page, defaults.pageSize, defaults.status, filters, searchParams, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return {
    filters,
    setFilters,
    resetFilters,
  };
}
