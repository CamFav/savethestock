import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck, UserRound, KeyRound, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangeMyPassword, useDeleteMyAccount, useMyAccount } from "@/features/accounts/api/accounts.queries";
import { getAccountRoleLabel } from "@/features/accounts/api/accounts.types";
import type { ApiError } from "@/shared/api/apiClient";
import { useSessionStore } from "@/shared/auth/sessionStore";
import { ConfirmDangerDialog } from "@/shared/ui/confirm-danger-dialog";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionCard } from "@/shared/ui/section-card";

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const candidate = error as Partial<ApiError>;

  if (candidate.status === 401) return "Votre session a expiré.";
  if (candidate.status === 404) return "Compte introuvable.";
  if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
    return candidate.message;
  }

  return fallback;
}

export function AccountSettingsPage() {
  const navigate = useNavigate();
  const clearSession = useSessionStore((s) => s.clearSession);
  const myAccountQuery = useMyAccount();
  const changePasswordMutation = useChangeMyPassword();
  const deleteMyAccountMutation = useDeleteMyAccount();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const form = useForm<PasswordFormValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  async function handleChangePassword(values: PasswordFormValues) {
    const currentPassword = values.currentPassword.trim();
    const newPassword = values.newPassword.trim();
    const confirmNewPassword = values.confirmNewPassword.trim();

    if (!currentPassword) {
      form.setError("currentPassword", { message: "Le mot de passe actuel est requis." });
      return;
    }

    if (!newPassword) {
      form.setError("newPassword", { message: "Le mot de passe est requis." });
      return;
    }

    if (newPassword.length < 8) {
      form.setError("newPassword", { message: "Minimum 8 caractères." });
      return;
    }

    if (!confirmNewPassword) {
      form.setError("confirmNewPassword", { message: "La confirmation est requise." });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      form.setError("confirmNewPassword", { message: "La confirmation ne correspond pas." });
      return;
    }

    if (currentPassword === newPassword) {
      form.setError("newPassword", { message: "Le nouveau mot de passe doit être différent de l'ancien." });
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      form.reset({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      toast.success("Mot de passe mis à jour.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de changer le mot de passe."));
    }
  }

  async function handleDeleteMyAccount() {
    try {
      await deleteMyAccountMutation.mutateAsync();
      clearSession();
      toast.success("Compte supprimé.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Impossible de supprimer le compte."));
    }
  }

  if (myAccountQuery.isLoading) {
    return (
      <section className="page-shell mx-auto w-full max-w-4xl">
        <PageHeader title="Paramètres du compte" description="Chargement de vos informations personnelles." />
      </section>
    );
  }

  if (myAccountQuery.isError || !myAccountQuery.data) {
    return (
      <section className="page-shell mx-auto w-full max-w-4xl">
        <PageHeader title="Paramètres du compte" description="Gestion personnelle de votre compte SaveTheStock." />
        <SectionCard
          title="Impossible de charger votre compte"
          description={getApiErrorMessage(myAccountQuery.error, "Une erreur inattendue est survenue.")}
        >
          <Button onClick={() => void myAccountQuery.refetch()}>Réessayer</Button>
        </SectionCard>
      </section>
    );
  }

  const account = myAccountQuery.data;

  return (
    <section className="page-shell">
      <PageHeader
        title="Paramètres du compte"
        description="Gérez vos informations personnelles, votre mot de passe et les actions sensibles liées à votre compte."
      />

      <SectionCard
        title={
          <span className="flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            Mon compte
          </span>
        }
        description="Informations personnelles utilisées dans votre espace SaveTheStock."
        contentClassName="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
          <div className="rounded-lg border border-border/70 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Nom affiché</p>
            <p className="mt-1 font-medium text-foreground">{account.displayName}</p>
          </div>
          <div className="rounded-lg border border-border/70 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
            <p className="mt-1 font-medium text-foreground">{account.email}</p>
          </div>
          <div className="rounded-lg border border-border/70 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Rôle</p>
            <p className="mt-1 font-medium text-foreground">{getAccountRoleLabel(account.role)}</p>
          </div>
      </SectionCard>

      <SectionCard
        title={
          <span className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Sécurité
          </span>
        }
        description="Changez votre mot de passe pour sécuriser votre accès."
      >
          <Form {...form}>
            <form className="max-w-md space-y-4" onSubmit={form.handleSubmit(handleChangePassword)}>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...form.register("currentPassword")}
                  disabled={changePasswordMutation.isPending}
                />
                {form.formState.errors.currentPassword ? (
                  <p className="text-sm text-destructive">{form.formState.errors.currentPassword.message}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Saisissez votre mot de passe actuel pour confirmer l'opération.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...form.register("newPassword", { minLength: 8 })}
                  disabled={changePasswordMutation.isPending}
                />
                {form.formState.errors.newPassword ? (
                  <p className="text-sm text-destructive">{form.formState.errors.newPassword.message ?? "Minimum 8 caractères."}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Minimum 8 caractères.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...form.register("confirmNewPassword")}
                  disabled={changePasswordMutation.isPending}
                />
                {form.formState.errors.confirmNewPassword ? (
                  <p className="text-sm text-destructive">{form.formState.errors.confirmNewPassword.message}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Répétez le nouveau mot de passe pour éviter les erreurs de saisie.</p>
                )}
              </div>

              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? "Enregistrement..." : "Mettre à jour le mot de passe"}
              </Button>
            </form>
          </Form>
      </SectionCard>

      <SectionCard
        title={
          <span className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-4 w-4" />
            Zone de danger
          </span>
        }
        description="La suppression du compte est irréversible. Si un historique métier existe, votre compte sera anonymisé."
        className="border-destructive/30 bg-destructive/5"
        contentClassName="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
          <div className="text-sm text-muted-foreground">
            {account.role.toUpperCase() === "OWNER" ? (
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Le compte propriétaire ne se supprime pas ici. Utilisez la suppression de la société si besoin.
              </span>
            ) : (
              "Votre accès sera immédiatement invalidé après confirmation."
            )}
          </div>

          <Button
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
            disabled={account.role.toUpperCase() === "OWNER"}
          >
            Supprimer mon compte
          </Button>
      </SectionCard>

      <ConfirmDangerDialog
        open={isDeleteOpen}
        pending={deleteMyAccountMutation.isPending}
        title="Supprimer mon compte"
        description="Votre compte sera supprimé ou anonymisé selon l’historique métier déjà enregistré."
        confirmLabel="Supprimer mon compte"
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteMyAccount}
      />
    </section>
  );
}
