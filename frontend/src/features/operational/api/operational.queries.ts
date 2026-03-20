import { useQuery } from "@tanstack/react-query";
import { getOperationalToday } from "@/features/operational/api/operational.api";
import { operationalKeys } from "@/features/operational/api/operational.keys";
import type { OperationalTodayParams } from "@/features/operational/api/operational.types";

export function useOperationalToday(params: OperationalTodayParams) {
  return useQuery({
    queryKey: operationalKeys.today(params),
    queryFn: () => getOperationalToday(params),
  });
}
