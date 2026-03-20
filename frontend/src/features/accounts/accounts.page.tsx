import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, ShieldUser, Trash2, UserPlus, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAccountsList, useDeleteAccount } from "@/features/accounts/api/accounts.queries";
import { CreateInvitationDialog } from "@/features/accounts/components/create-invitation-dialog";
import {
  getAccountRole,
  getAccountRoleLabel,
  getAccountStatus,
  getAccountStatusLabel,
} from "@/features/accounts/api/accounts.types";
import { accountsKeys } from "@/features/accounts/api/accounts.keys";
import { invitationsKeys } from "@/features/invitations/api/invitations.keys";
import { useCreateInvitation, useInvitationsList, useRevokeInvitation } from "@/features/invitations/api/invitations.queries";
import { getInvitationStatusLabel, type Invitation } from "@/features/invitations/api/invitations.types";
import type { ApiError } from "@/shared/api/apiClient";
import { useSessionStore } from "@/shared/auth/sessionStore";
import { ConfirmDangerDialog } from "@/shared/ui/confirm-danger-dialog";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionCard } from "@/shared/ui/section-card";

type SettingsOutletContext = {
  embeddedInSettings?: boolean;
};

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 401) return "Votre session a expiré.";
  if (error.status === 403) return "Cette page est reservee au proprietaire.";
  return error.message ?? fallback;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Date inconnue";
  }

  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function MembersPageSkeleton() {
  return (
    <section className="page-shell">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>

      <SectionCard>
        <div className="space-y-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </SectionCard>
    </section>
  );
}

export function AccountsPage() {
  const settingsContext = useOutletContext<SettingsOutletContext | null>();
  const embeddedInSettings = settingsContext?.embeddedInSettings ?? false;
  const [searchParams, setSearchParams] = useSearchParams();
  const currentAccountId = useSessionStore((s) => s.accountId);
  const queryClient = useQueryClient();
  const accountsQuery = useAccountsList();
  const invitationsQuery = useInvitationsList();
  const deleteAccountMutation = useDeleteAccount();
  const createInvitationMutation = useCreateInvitation();
  const revokeInvitationMutation = useRevokeInvitation();
  const [createdInvitation, setCreatedInvitation] = useState<Invitation | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; displayName: string } | null>(null);
  const isInviteOpen = searchParams.get("invite") === "1";
  const members = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const invitations = useMemo(() => invitationsQuery.data ?? [], [invitationsQuery.data]);
  const pendingInvitations = useMemo(
    () => invitations.filter((invitation) => invitation.status.toUpperCase() === "PENDING"),
    [invitations],
  );
  const ownerCount = members.filter((account) => getAccountRole(account.role) === "OWNER").length;

  function setInviteOpen(open: boolean) {
    const next = new URLSearchParams(searchParams);
    if (open) next.set("invite", "1");
    else next.delete("invite");
    setSearchParams(next, { replace: true });
  }

  if (accountsQuery.isLoading || invitationsQuery.isLoading) {
    return <MembersPageSkeleton />;
  }

  if (accountsQuery.isError || invitationsQuery.isError) {
    const apiError = (accountsQuery.error ?? invitationsQuery.error) as unknown as ApiError;

    return (
      <section className="page-shell">
        {embeddedInSettings ? null : (
          <PageHeader
            title="Membres"
            description="Gérez les accès de l’équipe et les invitations en attente pour votre société."
          />
        )}

        <SectionCard title="Impossible de charger les membres" description={getApiErrorMessage(apiError, "Une erreur inattendue est survenue.")}>
          <div>
            <Button
              onClick={() => {
                void accountsQuery.refetch();
                void invitationsQuery.refetch();
              }}
            >
              Réessayer
            </Button>
          </div>
        </SectionCard>
      </section>
    );
  }

  async function handleCreateInvitation(values: { displayName: string; email: string; role: "MEMBER" }) {
    try {
      const invitation = await createInvitationMutation.mutateAsync(values);
      setCreatedInvitation(invitation);
      await queryClient.invalidateQueries({ queryKey: invitationsKeys.list() });
      toast.success("Lien d’invitation généré.");
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(getApiErrorMessage(apiError, "Impossible de créer l’invitation."));
    }
  }

  async function handleCopyInvitationLink(invitation: Invitation) {
    const url = new URL(invitation.invitationPath, window.location.origin).toString();
    await navigator.clipboard.writeText(url);
    toast.success("Lien d’invitation copié.");
  }

  async function handleRevokeInvitation(invitationId: string) {
    try {
      await revokeInvitationMutation.mutateAsync(invitationId);
      await queryClient.invalidateQueries({ queryKey: invitationsKeys.list() });
      toast.success("Invitation annulée.");
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(getApiErrorMessage(apiError, "Impossible d’annuler l’invitation."));
    }
  }

  async function handleDeleteMember() {
    if (!memberToDelete) return;

    try {
      await deleteAccountMutation.mutateAsync(memberToDelete.id);
      await queryClient.invalidateQueries({ queryKey: accountsKeys.list() });
      setMemberToDelete(null);
      toast.success("Membre supprimé.");
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(getApiErrorMessage(apiError, "Impossible de supprimer ce membre."));
    }
  }

  return (
    <section className="page-shell">
      {embeddedInSettings ? null : (
        <PageHeader
          title="Membres"
          description="Gérez les accès de l’équipe et les invitations en attente pour votre société."
          actions={
            <Button
              onClick={() => {
                setCreatedInvitation(null);
                setInviteOpen(true);
              }}
            >
              <UserPlus className="h-4 w-4" />
              Inviter un membre
            </Button>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription>Membres actifs</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              {members.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Personnes ayant actuellement accès à l’espace de travail de l’entreprise.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription>Proprietaires</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldUser className="h-5 w-5" />
              {ownerCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Personnes autorisées à gérer les accès et les réglages importants.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardDescription>Invitations en attente</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5" />
              {pendingInvitations.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Liens générés mais pas encore acceptés par les futurs membres de l’équipe.
            </p>
          </CardContent>
        </Card>
      </div>

      <SectionCard title="Liste des membres" description="Comptes déjà rattachés à cette société.">
          {members.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <p className="text-sm font-medium text-foreground">Aucun membre à afficher.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                La liste se remplira ici dès qu’un autre compte rejoindra la société.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Arrivée</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const status = getAccountStatus(member);
                  const isCurrentMember = currentAccountId === member.id;

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{member.displayName}</p>
                            {isCurrentMember ? (
                              <span className="inline-flex rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
                                Vous
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                          {getAccountRoleLabel(member.role)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            status === "ACTIVE"
                              ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                              : status === "ACTIVATION_REQUIRED"
                                ? "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                                : "inline-flex rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
                          }
                        >
                          {getAccountStatusLabel(status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{formatDate(member.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {getAccountRole(member.role) === "MEMBER" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setMemberToDelete({ id: member.id, displayName: member.displayName })}
                          >
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Conservé</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
      </SectionCard>

      <SectionCard
        title="Invitations en attente"
        description="Copiez le lien puis partagez-le manuellement avec le futur membre. Le lien expire automatiquement au bout de 7 jours."
      >
          {pendingInvitations.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <p className="text-sm font-medium text-foreground">Aucune invitation en attente.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Utilisez “Inviter un membre” pour générer un nouveau lien d’accès.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre invité</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Créée le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.displayName}</TableCell>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                          <span className="inline-flex rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                            {invitation.role.toUpperCase() === "OWNER" ? "Propriétaire" : "Membre"}
                          </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                        {getInvitationStatusLabel(invitation.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(invitation.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => void handleCopyInvitationLink(invitation)}>
                          <Copy className="h-4 w-4" />
                          Copier le lien
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={revokeInvitationMutation.isPending}
                          onClick={() => void handleRevokeInvitation(invitation.id)}
                        >
                          <XCircle className="h-4 w-4" />
                          Annuler
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </SectionCard>

      <CreateInvitationDialog
        open={isInviteOpen}
        pending={createInvitationMutation.isPending}
        invitation={createdInvitation}
        onOpenChange={(open) => {
          setInviteOpen(open);
          if (!open) {
            setCreatedInvitation(null);
          }
        }}
        onSubmit={handleCreateInvitation}
      />

      <ConfirmDangerDialog
        open={memberToDelete !== null}
        pending={deleteAccountMutation.isPending}
        title="Supprimer ce membre"
        description={
          memberToDelete
            ? `Le compte de ${memberToDelete.displayName} sera supprimé ou anonymisé selon son historique.`
            : ""
        }
        confirmLabel="Supprimer le membre"
        onOpenChange={(open) => {
          if (!open) setMemberToDelete(null);
        }}
        onConfirm={handleDeleteMember}
      />
    </section>
  );
}
