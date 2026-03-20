import type { WasteSessionsListParams } from "@/features/waste-sessions/api/wasteSessions.types";

export const wasteSessionsKeys = {
  all: ["waste-sessions"] as const,
  lists: () => [...wasteSessionsKeys.all, "list"] as const,
  list: (params: WasteSessionsListParams) => [...wasteSessionsKeys.lists(), params] as const,
  details: () => [...wasteSessionsKeys.all, "detail"] as const,
  detail: (id: string) => [...wasteSessionsKeys.details(), id] as const,
};
