import { useMutation } from "@tanstack/react-query";
import { deleteMyCompany } from "@/features/companies/api/companies.api";

export function useDeleteMyCompany() {
  return useMutation({
    mutationFn: deleteMyCompany,
  });
}
