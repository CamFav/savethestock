import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarClock, Phone, Plus, ReceiptText, Search, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReceptionsList } from "@/features/receptions/api/receptions.queries";
import {
  useCreateSupplier,
  useDeleteSupplier,
  useSuppliersList,
  useUpdateSupplier,
} from "@/features/suppliers/api/suppliers.queries";
import { DeleteSupplierDialog } from "@/features/suppliers/components/DeleteSupplierDialog";
import { SupplierDialog } from "@/features/suppliers/components/SupplierDialog";
import { SuppliersPageSkeleton } from "@/features/suppliers/components/SuppliersPageSkeleton";
import type { SupplierFormValues, SupplierListItem } from "@/features/suppliers/suppliers.types";
import type { ApiError } from "@/shared/api/apiClient";
import { isOwnerRole } from "@/shared/auth/roles";
import { useSessionStore } from "@/shared/auth/sessionStore";
import { ModuleHeroHeader } from "@/shared/ui/module-hero-header";
import { PageHeader } from "@/shared/ui/page-header";
import { ReadonlyNotice } from "@/shared/ui/readonly-notice";
import { SectionCard } from "@/shared/ui/section-card";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; supplier: SupplierListItem }
  | null;

const SUPPLIERS_PAGE_SIZE = 200;
const RECEPTIONS_PAGE_SIZE = 200;

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 409) {
    return "Un fournisseur portant ce nom existe déjà.";
  }

  if (error.status === 404) return "Fournisseur introuvable.";
  if (error.status === 400) return error.message ?? "Requête invalide.";
  if (error.status === 401) return "Votre session a expiré.";
  return error.message ?? fallback;
}

function formatDate(value?: string): string {
  if (!value) {
    return "Aucune réception encore";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date non disponible";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function SuppliersPage() {
  const role = useSessionStore((s) => s.role);
  const canManage = isOwnerRole(role);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierListItem | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue);

  const suppliersQuery = useSuppliersList({ page: 1, pageSize: SUPPLIERS_PAGE_SIZE });
  const receptionsQuery = useReceptionsList({ page: 1, pageSize: RECEPTIONS_PAGE_SIZE });
  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();
  const deleteSupplierMutation = useDeleteSupplier();

  const items = suppliersQuery.data?.items ?? [];
  const receptions = receptionsQuery.data?.items ?? [];
  const editTarget = dialogState?.mode === "edit" ? dialogState.supplier : null;

  const receptionStatsBySupplier = useMemo(() => {
    const stats = new Map<string, { count: number; latestDate?: string }>();

    for (const reception of receptions) {
      if (!reception.supplierId) {
        continue;
      }

      const current = stats.get(reception.supplierId) ?? { count: 0, latestDate: undefined };
      current.count += 1;

      if (!current.latestDate || (reception.receptionDate ?? "") > current.latestDate) {
        current.latestDate = reception.receptionDate;
      }

      stats.set(reception.supplierId, current);
    }

    return stats;
  }, [receptions]);

  const filteredSuppliers = useMemo(() => {
    const normalizedQuery = deferredSearchValue.trim().toLocaleLowerCase("fr-FR");
    if (!normalizedQuery) {
      return items;
    }

    return items.filter((supplier) => supplier.name.toLocaleLowerCase("fr-FR").includes(normalizedQuery));
  }, [deferredSearchValue, items]);

  const recentSuppliers = useMemo(() => {
    const last30Days = Date.now() - 30 * 24 * 60 * 60 * 1000;

    return items.filter((supplier) => {
      const latestDate = receptionStatsBySupplier.get(supplier.id)?.latestDate;
      return latestDate ? new Date(latestDate).getTime() >= last30Days : false;
    }).length;
  }, [items, receptionStatsBySupplier]);

  const limitNotice = useMemo(() => {
    const notices: string[] = [];

    if ((suppliersQuery.data?.total ?? 0) > items.length) {
      notices.push(`La page affiche pour l'instant les ${items.length} premiers fournisseurs chargés.`);
    }

    if ((receptionsQuery.data?.total ?? 0) > receptions.length) {
      notices.push(`Les repères de réception sont calculés sur les ${receptions.length} premières réceptions chargées.`);
    }

    return notices.join(" ");
  }, [items.length, receptions.length, receptionsQuery.data?.total, suppliersQuery.data?.total]);

  const openCreateDialog = useCallback(() => setDialogState({ mode: "create" }), []);
  const openEditDialog = useCallback((supplier: SupplierListItem) => setDialogState({ mode: "edit", supplier }), []);
  const openDeleteDialog = useCallback((supplier: SupplierListItem) => setDeleteTarget(supplier), []);
  const closeDialog = useCallback(() => setDialogState(null), []);
  const closeDeleteDialog = useCallback(() => setDeleteTarget(null), []);

  const handleSubmitSupplier = useCallback(
    async (values: SupplierFormValues) => {
      try {
        if (dialogState?.mode === "edit" && dialogState.supplier) {
          await updateSupplierMutation.mutateAsync({
            id: dialogState.supplier.id,
            name: values.name,
            email: values.email || undefined,
            phone: values.phone || undefined,
          });
          toast.success("Fournisseur mis à jour.");
        } else {
          await createSupplierMutation.mutateAsync({
            name: values.name,
            email: values.email || undefined,
            phone: values.phone || undefined,
          });
          toast.success("Fournisseur ajouté.");
        }

        closeDialog();
      } catch (error) {
        toast.error(getApiErrorMessage(error as ApiError, "Impossible d’enregistrer le fournisseur."));
      }
    },
    [closeDialog, createSupplierMutation, dialogState, updateSupplierMutation],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteSupplierMutation.mutateAsync({ id: deleteTarget.id });
      closeDeleteDialog();
      toast.success("Fournisseur retiré.");
    } catch (error) {
      toast.error(getApiErrorMessage(error as ApiError, "Impossible de retirer le fournisseur."));
    }
  }, [closeDeleteDialog, deleteSupplierMutation, deleteTarget]);

  if (suppliersQuery.isLoading || receptionsQuery.isLoading) {
    return <SuppliersPageSkeleton />;
  }

  if (suppliersQuery.isError || receptionsQuery.isError) {
    const apiError = (suppliersQuery.error ?? receptionsQuery.error) as unknown as ApiError;

    return (
      <section className="page-shell space-y-6">
        <PageHeader
          title="Fournisseurs"
          description="Gérez vos fournisseurs"
          actions={canManage ? <Button onClick={openCreateDialog}>Nouveau fournisseur</Button> : null}
        />

        <SectionCard title="Impossible d'ouvrir les fournisseurs" description={getApiErrorMessage(apiError, "Une erreur inattendue est survenue.")}>
          <Button onClick={() => void Promise.all([suppliersQuery.refetch(), receptionsQuery.refetch()])}>Réessayer</Button>
        </SectionCard>
      </section>
    );
  }

  return (
    <section className="page-shell-wide space-y-6">
      <ModuleHeroHeader
        eyebrow="Achats"
        title="Fournisseurs"
        description="Gérez vos fournisseurs"
        tone="suppliers"
        actions={
          <>
            {canManage ? (
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
                Nouveau fournisseur
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/app/orders">
                <ReceiptText className="h-4 w-4" />
                Ouvrir les commandes
              </Link>
            </Button>
          </>
        }
        stats={[
          {
            label: "Fournisseurs",
            value: filteredSuppliers.length,
            help: "Vos Fournisseurs",
          },
          {
            label: "Actifs sur 30 jours",
            value: recentSuppliers,
            help: "Avec une livraison récente",
          },
        ]}
      />

      <SectionCard
        title="Recherche fournisseur"
        description="Recherche par nom sur les fournisseurs chargés dans cette page."
        contentClassName="space-y-5"
      >
        <label className="group block">
          <span className="mb-2 block text-sm font-medium text-foreground">Nom du fournisseur</span>
          <div className="flex h-14 items-center gap-3 rounded-[20px] border border-border bg-background px-4 shadow-[0_12px_32px_-30px_rgba(15,23,42,0.5)] transition-colors group-focus-within:border-foreground/30">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="h-auto border-0 bg-transparent px-0 py-0 text-base shadow-none ring-0 focus-visible:ring-0"
              placeholder="Ex. primeur, boucherie, epicerie"
            />
          </div>
        </label>

        {!canManage ? <ReadonlyNotice /> : null}
        {limitNotice ? <p className="text-xs text-muted-foreground">{limitNotice}</p> : null}
      </SectionCard>

      {filteredSuppliers.length === 0 ? (
        <SectionCard
          title="Aucun fournisseur a afficher"
          description={searchValue ? "Essayez un autre nom ou videz la recherche." : "Ajoutez votre premier fournisseur pour structurer les achats."}
        >
          <div className="flex flex-wrap items-center gap-3">
            {searchValue ? (
              <Button variant="outline" onClick={() => setSearchValue("")}>
                Effacer la recherche
              </Button>
            ) : null}
            {canManage ? <Button onClick={openCreateDialog}>Ajouter un fournisseur</Button> : null}
          </div>
        </SectionCard>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Liste fournisseur</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-foreground">Partenaires a mobiliser pour les achats</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredSuppliers.length} fournisseur(s) affiche(s) sur {items.length}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {filteredSuppliers.map((supplier) => {
              const receptionStats = receptionStatsBySupplier.get(supplier.id);
              const receptionsCount = receptionStats?.count ?? 0;

              return (
                <article key={supplier.id} className="rounded-[28px] border border-border/80 bg-card p-5 shadow-[0_16px_50px_-38px_rgba(15,23,42,0.38)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        <Truck className="h-3 w-3" />
                        Fournisseur
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold tracking-[-0.03em] text-foreground">{supplier.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {receptionsCount > 0 ? `${receptionsCount} réception(s) enregistrée(s)` : "Pas encore utilisé en réception"}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {receptionsCount > 0 ? "Actif" : "À préparer"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3">
                    <div className="rounded-2xl bg-muted/70 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dernière réception</p>
                      <p className="mt-2 text-base font-semibold text-foreground">{formatDate(receptionStats?.latestDate)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-muted/70 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Coordonnées</p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {supplier.phone ?? supplier.email ?? "À compléter"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-muted/70 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Repère achat</p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
                          <CalendarClock className="h-4 w-4 text-muted-foreground" />
                          {receptionsCount > 0 ? "Déjà référencé" : "Nouveau partenaire"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Button asChild>
                      <Link to="/app/receptions">
                        <ReceiptText className="h-4 w-4" />
                        Voir les réceptions
                      </Link>
                    </Button>
                    {canManage ? (
                      <Button variant="outline" onClick={() => openEditDialog(supplier)}>
                        <Building2 className="h-4 w-4" />
                        Modifier
                      </Button>
                    ) : null}
                    {canManage ? (
                      <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => openDeleteDialog(supplier)}>
                        Retirer
                      </Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {canManage ? (
        <>
          <SupplierDialog
            open={dialogState !== null}
            mode={dialogState?.mode === "edit" ? "edit" : "create"}
            defaultSupplier={editTarget}
            onOpenChange={(open) => {
              if (!open) {
                closeDialog();
              }
            }}
            onSubmit={handleSubmitSupplier}
          />

          <DeleteSupplierDialog
            open={deleteTarget !== null}
            supplierName={deleteTarget?.name}
            pending={deleteSupplierMutation.isPending}
            onOpenChange={(open) => {
              if (!open) {
                closeDeleteDialog();
              }
            }}
            onConfirm={handleDeleteConfirm}
          />
        </>
      ) : null}
    </section>
  );
}
