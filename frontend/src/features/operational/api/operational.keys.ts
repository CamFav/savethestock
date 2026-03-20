import type { OperationalTodayParams } from "@/features/operational/api/operational.types";

export const operationalKeys = {
  all: ["operational"] as const,
  today: (params: OperationalTodayParams) => [...operationalKeys.all, "today", params] as const,
};
