import type { LotListParams, LotsByReceptionParams } from "@/features/lots/lots.types";

export const lotsKeys = {
  all: ["lots"] as const,
  lists: () => [...lotsKeys.all, "list"] as const,
  list: (params: LotListParams) => [...lotsKeys.lists(), params] as const,
  byReceptions: () => [...lotsKeys.all, "by-reception"] as const,
  byReception: (params: LotsByReceptionParams) => [...lotsKeys.byReceptions(), params] as const,
  details: () => [...lotsKeys.all, "detail"] as const,
  detail: (id: string) => [...lotsKeys.details(), id] as const,
};
