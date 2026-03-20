import { api } from "@/shared/api/apiClient";
import type { OperationalTodayDto, OperationalTodayParams } from "@/features/operational/api/operational.types";

export async function getOperationalToday(params: OperationalTodayParams): Promise<OperationalTodayDto> {
  const res = await api.get<OperationalTodayDto>("/api/operational/today", {
    params: {
      expiryDays: params.expiryDays ?? 3,
      lowStockOnly: params.lowStockOnly ?? true,
    },
  });

  return res.data;
}
