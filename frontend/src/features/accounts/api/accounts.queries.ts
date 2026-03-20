import { useMutation, useQuery } from "@tanstack/react-query";
import { changeMyPassword, deleteAccount, deleteMyAccount, getAccounts, getMyAccount } from "@/features/accounts/api/accounts.api";
import { accountsKeys } from "@/features/accounts/api/accounts.keys";

export function useAccountsList() {
  return useQuery({
    queryKey: accountsKeys.list(),
    queryFn: getAccounts,
  });
}

export function useMyAccount() {
  return useQuery({
    queryKey: [...accountsKeys.all, "me"],
    queryFn: getMyAccount,
  });
}

export function useChangeMyPassword() {
  return useMutation({
    mutationFn: (payload: {
      currentPassword: string;
      newPassword: string;
      confirmNewPassword: string;
    }) => changeMyPassword(payload),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (accountId: string) => deleteAccount(accountId),
  });
}

export function useDeleteMyAccount() {
  return useMutation({
    mutationFn: deleteMyAccount,
  });
}
