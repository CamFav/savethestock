import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAcceptInvitation, useInvitationToken } from "@/features/invitations/api/invitations.queries";
import { getInvitationStatusLabel } from "@/features/invitations/api/invitations.types";
import type { ApiError } from "@/shared/api/apiClient";
import { useSessionStore } from "@/shared/auth/sessionStore";

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 404) return "Ce lien d’invitation est introuvable.";
  return error.message ?? fallback;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Date inconnue";
  }

  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function InvitePage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const setSession = useSessionStore((s) => s.setSession);
  const invitationQuery = useInvitationToken(token);
  const acceptMutation = useAcceptInvitation(token);
  const [registerPassword, setRegisterPassword] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  async function handleAccept(mode: "REGISTER" | "LOGIN", password: string) {
    if (!password.trim()) {
      toast.error("Le mot de passe est requis.");
      return;
    }

    try {
      const auth = await acceptMutation.mutateAsync({ mode, password });

      setSession({
        jwtToken: auth.jwtToken,
        accountId: auth.accountId,
        companyId: auth.companyId,
        role: auth.role,
        displayName: auth.displayName,
      });

      toast.success("Invitation acceptée.");
      navigate("/app/today", { replace: true });
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(getApiErrorMessage(apiError, "Impossible d’accepter l’invitation."));
    }
  }

  if (invitationQuery.isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Chargement de l’invitation</CardTitle>
            <CardDescription>Vérification du lien en cours.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (invitationQuery.isError || !invitationQuery.data) {
    const apiError = invitationQuery.error as unknown as ApiError;

    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Invitation indisponible</CardTitle>
            <CardDescription>{getApiErrorMessage(apiError, "Ce lien n’est plus disponible.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" to="/login">
              Retour à la connexion
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invitation = invitationQuery.data;
  const normalizedStatus = invitation.status.toUpperCase();
  const isPending = normalizedStatus === "PENDING";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-10">
      <div className="w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invitation SaveTheStock</CardTitle>
            <CardDescription>
              Rejoignez l’espace <span className="font-medium text-foreground">{invitation.companyName}</span> avec les
              informations préparées pour vous.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Nom</p>
                <p className="mt-1 font-medium text-foreground">{invitation.displayName}</p>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email invité</p>
                <p className="mt-1 font-medium text-foreground">{invitation.email}</p>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Rôle</p>
                <p className="mt-1 font-medium text-foreground">{invitation.role.toUpperCase() === "OWNER" ? "Propriétaire" : "Membre"}</p>
              </div>
              <div className="rounded-lg border border-border/70 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Statut</p>
                <p className="mt-1 font-medium text-foreground">{getInvitationStatusLabel(invitation.status)}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">Cette invitation expire le {formatDate(invitation.expiresAt)}.</p>
          </CardContent>
        </Card>

        {!isPending ? (
          <Card>
            <CardHeader>
              <CardTitle>Invitation non disponible</CardTitle>
              <CardDescription>
                Cette invitation est actuellement au statut <span className="font-medium">{getInvitationStatusLabel(invitation.status)}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" to="/login">
                Retour à la connexion
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Créer mon compte</CardTitle>
                <CardDescription>
                  Si vous n’avez pas encore de compte SaveTheStock, créez-le avec l’email invité.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-register-email">Email</Label>
                  <Input id="invite-register-email" value={invitation.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-register-password">Mot de passe</Label>
                  <Input
                    id="invite-register-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(event) => setRegisterPassword(event.target.value)}
                    disabled={acceptMutation.isPending}
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={acceptMutation.isPending}
                  onClick={() => void handleAccept("REGISTER", registerPassword)}
                >
                  {acceptMutation.isPending ? "Création..." : "Créer et rejoindre la société"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>J’ai déjà un compte</CardTitle>
                <CardDescription>
                  Connectez-vous avec ce même email pour accepter l’invitation si votre compte appartient déjà à cette société.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-login-email">Email</Label>
                  <Input id="invite-login-email" value={invitation.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-login-password">Mot de passe</Label>
                  <Input
                    id="invite-login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    disabled={acceptMutation.isPending}
                  />
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={acceptMutation.isPending}
                  onClick={() => void handleAccept("LOGIN", loginPassword)}
                >
                  {acceptMutation.isPending ? "Connexion..." : "Se connecter et accepter"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
