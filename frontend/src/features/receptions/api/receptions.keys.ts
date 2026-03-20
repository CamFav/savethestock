import type { ReceptionsListParams } from "@/features/receptions/receptions.types";

export const receptionsKeys = {
  all: ["receptions"] as const,
  lists: () => [...receptionsKeys.all, "list"] as const,
  list: (params: ReceptionsListParams) => [...receptionsKeys.lists(), params] as const,
  details: () => [...receptionsKeys.all, "detail"] as const,
  detail: (id: string) => [...receptionsKeys.details(), id] as const,
};
