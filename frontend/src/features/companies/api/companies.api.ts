import { api } from "@/shared/api/apiClient";

export async function deleteMyCompany(): Promise<void> {
  await api.delete("/api/company");
}
