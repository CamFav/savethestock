import { useNavigate, Outlet, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDeleteMyCompany } from "@/features/companies/api/companies.queries";
import type { ApiError } from "@/shared/api/apiClient";
import { useSessionStore } from "@/shared/auth/sessionStore";
import { ConfirmDangerDialog } from "@/shared/ui/confirm-danger-dialog";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionCard } from "@/shared/ui/section-card";

export function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const clearSession = useSessionStore((s) => s.clearSession);
  const deleteCompanyMutation = useDeleteMyCompany();
  const [isDeleteCompanyOpen, setIsDeleteCompanyOpen] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  async function handleDeleteCompany() {
    try {
      await deleteCompanyMutation.mutateAsync();
      clearSession();
      toast.success("Société supprimée.");
      navigate("/login", { replace: true });
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message ?? "Impossible de supprimer la société.");
    }
  }

  return (
    <section className="page-shell">
      <PageHeader
        title="Paramètres"
        description="Gérez les membres de votre espace."
        actions={
          <Button
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set("invite", "1");
              setSearchParams(next, { replace: true });
            }}
          >
            Inviter un membre
          </Button>
        }
      />

      <Outlet context={{ embeddedInSettings: true }} />

      <SectionCard
        title="Suppression de la société"
        description="Cette zone concerne uniquement la suppression complète de votre espace."
        className="border-destructive/30 bg-destructive/5"
        titleClassName="text-destructive"
        actions={
          <Button variant="outline" onClick={() => setShowDangerZone((value) => !value)}>
            {showDangerZone ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Masquer
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Afficher
              </>
            )}
          </Button>
        }
      >
        {showDangerZone ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Supprimer la société efface définitivement les membres, le stock et l'historique.
            </p>
            <div>
              <Button variant="destructive" onClick={() => setIsDeleteCompanyOpen(true)}>
                Supprimer la société
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ouvrez cette zone seulement si vous souhaitez supprimer complètement votre espace.
          </p>
        )}
      </SectionCard>

      <ConfirmDangerDialog
        open={isDeleteCompanyOpen}
        pending={deleteCompanyMutation.isPending}
        title="Supprimer la société"
        description="Cette action est irréversible. Toutes les données de votre espace seront supprimées."
        confirmLabel="Supprimer la société"
        confirmText="DELETE"
        onOpenChange={setIsDeleteCompanyOpen}
        onConfirm={handleDeleteCompany}
      />
    </section>
  );
}
