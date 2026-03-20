import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductsAll } from "@/features/products/api/products.queries";
import { exportWasteSessionsCsv } from "@/features/waste-sessions/api/wasteSessions.api";
import { useCreateWasteSession, useDeleteWasteSession, useWasteSessionsList } from "@/features/waste-sessions/api/wasteSessions.queries";
import type { WasteSession } from "@/features/waste-sessions/api/wasteSessions.types";
import { CreateWasteSessionDialog } from "@/features/waste-sessions/components/create-waste-session-dialog";
import { WasteSessionsTable } from "@/features/waste-sessions/components/waste-sessions-table";
import { buildCsvFilename, downloadBlobFile } from "@/shared/files/download";
import { useUrlQueryFilters } from "@/shared/routing/use-url-query-filters";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";
import { Pagination } from "@/shared/ui/pagination";
import type { ApiError } from "@/shared/api/apiClient";
import { ModuleHeroHeader } from "@/shared/ui/module-hero-header";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionCard } from "@/shared/ui/section-card";

const DeleteWasteSessionDialog = lazy(() =>
  import("@/features/waste-sessions/components/delete-waste-session-dialog").then((module) => ({ default: module.DeleteWasteSessionDialog })),
);

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 404) return "Ressource introuvable.";
  if (error.status === 400) return error.message ?? "Requête invalide.";
  if (error.status === 401) return "Votre session a expiré.";
  return error.message ?? fallback;
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getPresetRange(preset: "7d" | "30d" | "thisMonth") {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (preset === "7d") {
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 6);
    return { from: toIsoDate(start), to: toIsoDate(end) };
  }

  if (preset === "30d") {
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 29);
    return { from: toIsoDate(start), to: toIsoDate(end) };
  }

  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  return { from: toIsoDate(start), to: toIsoDate(end) };
}

export function WasteSessionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteTarget, setDeleteTarget] = useState<WasteSession | null>(null);
  const { filters, setFilters, resetFilters } = useUrlQueryFilters({ defaultStatus: "all", defaultPage: 1, defaultPageSize: 10 });
  const createWasteSessionMutation = useCreateWasteSession();
  const deleteWasteSessionMutation = useDeleteWasteSession();
  const isCreateOpen = searchParams.get("create") === "1";

  const params = useMemo(
    () => ({
      page: filters.page,
      pageSize: filters.pageSize,
      from: filters.from || undefined,
      to: filters.to || undefined,
      status: filters.status === "all" ? undefined : filters.status,
      productId: filters.productId || undefined,
      reason: filters.reason || undefined,
    }),
    [filters],
  );

  const productsQuery = useProductsAll();
  const wasteSessionsQuery = useWasteSessionsList(params);
  const exportCsvMutation = useMutation({
    mutationFn: () =>
      exportWasteSessionsCsv({
        from: filters.from || undefined,
        to: filters.to || undefined,
        status: filters.status === "all" ? undefined : filters.status,
        productId: filters.productId || undefined,
        reason: filters.reason || undefined,
      }),
  });

  const items = useMemo(() => wasteSessionsQuery.data?.items ?? [], [wasteSessionsQuery.data?.items]);
  const total = wasteSessionsQuery.data?.total ?? 0;
  const products = useMemo(() => productsQuery.data?.items ?? [], [productsQuery.data?.items]);
  const draftCount = useMemo(() => items.filter((item) => item.status?.toUpperCase() === "DRAFT").length, [items]);
  const validatedCount = useMemo(() => items.filter((item) => item.status?.toUpperCase() === "POSTED").length, [items]);

  const setCreateOpen = useCallback(
    (open: boolean) => {
      const next = new URLSearchParams(searchParams);
      if (open) next.set("create", "1");
      else next.delete("create");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleExportCsv = useCallback(async () => {
    try {
      const blob = await exportCsvMutation.mutateAsync();
      downloadBlobFile(blob, buildCsvFilename("waste", filters.from || undefined, filters.to || undefined));
      toast.success("CSV exporté.");
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 404) {
        toast.error("L’export CSV n’est pas encore disponible côté API.");
        return;
      }
      toast.error(getApiErrorMessage(apiError, "Impossible d’exporter le CSV."));
    }
  }, [exportCsvMutation, filters.from, filters.to]);

  const handlePageSizeChange = useCallback((nextPageSize: number) => {
    setFilters({ pageSize: nextPageSize, page: 1 });
  }, [setFilters]);

  const handleCreateWasteSession = useCallback(
    async (values: { wasteDate: string; comment: string }) => {
      try {
        const created = await createWasteSessionMutation.mutateAsync({
          wasteDate: values.wasteDate,
          comment: values.comment.trim() || undefined,
        });

        toast.success("Perte créée.");
        navigate(`/app/waste-sessions/${created.id}`, { replace: true });
      } catch (error) {
        const apiError = error as ApiError;
        toast.error(getApiErrorMessage(apiError, "Impossible de créer la perte. Réessayez."));
      }
    },
    [createWasteSessionMutation, navigate],
  );

  const handleDeleteWasteSession = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      await deleteWasteSessionMutation.mutateAsync({ id: deleteTarget.id });
      toast.success("Perte supprimée.");
      setDeleteTarget(null);
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(getApiErrorMessage(apiError, "Impossible de supprimer cette perte."));
    }
  }, [deleteTarget, deleteWasteSessionMutation]);

  if (wasteSessionsQuery.isError) {
    const apiError = wasteSessionsQuery.error as unknown as ApiError;

    return (
      <section className="page-shell">
        <PageHeader title="Pertes" description="Déclarez les produits perdus ou jetés." />
        <SectionCard
          title="Impossible de charger les pertes"
          description={getApiErrorMessage(apiError, "Une erreur inattendue est survenue.")}
        >
          <Button onClick={() => wasteSessionsQuery.refetch()}>Réessayer</Button>
        </SectionCard>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <ModuleHeroHeader
        eyebrow="Sorties à déclarer"
        title="Pertes"
        description="Déclarez les produits perdus ou jetés."
        tone="waste"
        actions={
          <>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouvelle perte
            </Button>
            <Button variant="outline" onClick={() => void handleExportCsv()} disabled={exportCsvMutation.isPending}>
              <Download className="h-4 w-4" />
              {exportCsvMutation.isPending ? "Export..." : "Exporter CSV"}
            </Button>
          </>
        }
        stats={[
          { label: "Declarations", value: total, help: "Dans la selection actuelle" },
          { label: "Brouillons", value: draftCount, help: "A reprendre ou completer" },
          { label: "Validées", value: validatedCount, help: "Pertes déjà terminées" },
        ]}
      />

      <SectionCard title="Filtres" description="Affinez la liste par période, statut, produit ou motif." contentClassName="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setFilters({ ...getPresetRange("7d"), page: 1 })}>7 jours</Button>
            <Button size="sm" variant="outline" onClick={() => setFilters({ ...getPresetRange("30d"), page: 1 })}>30 jours</Button>
            <Button size="sm" variant="outline" onClick={() => setFilters({ ...getPresetRange("thisMonth"), page: 1 })}>Ce mois</Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="waste-from-date">Du</label>
              <Input id="waste-from-date" type="date" value={filters.from} onChange={(event) => setFilters({ from: event.target.value, page: 1 })} />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="waste-to-date">Au</label>
              <Input id="waste-to-date" type="date" value={filters.to} onChange={(event) => setFilters({ to: event.target.value, page: 1 })} />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="waste-status">Statut</label>
              <select
                id="waste-status"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={filters.status}
                onChange={(event) => setFilters({ status: event.target.value, page: 1 })}
              >
                <option value="all">Tous</option>
                <option value="DRAFT">Brouillon</option>
                <option value="POSTED">Validé</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="waste-product">Produit</label>
              <select
                id="waste-product"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={filters.productId}
                onChange={(event) => setFilters({ productId: event.target.value, page: 1 })}
              >
                <option value="">Tous les produits</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="waste-reason">Motif</label>
              <Input
                id="waste-reason"
                value={filters.reason}
                placeholder="Ex. périmé, cassé, erreur..."
                onChange={(event) => setFilters({ reason: event.target.value, page: 1 })}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button type="button" variant="outline" className="w-full" onClick={() => { resetFilters(); }}>
                Réinitialiser
              </Button>
            </div>
          </div>
      </SectionCard>

      <SectionCard
        title="Liste des pertes"
        description={`${total} session${total > 1 ? "s" : ""}`}
        contentClassName="space-y-4"
      >
          {wasteSessionsQuery.isLoading ? (
            <div className="space-y-2">
              <div className="h-10 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded bg-muted" />
            </div>
          ) : items.length === 0 ? (
            <EmptyStateCard
              title="Aucune perte pour le moment"
              description="Créez votre première déclaration de perte pour suivre les sorties de stock."
              ctaLabel="Nouvelle perte"
              onCtaClick={() => setCreateOpen(true)}
            />
          ) : (
            <WasteSessionsTable
              items={items}
              deletePendingId={deleteWasteSessionMutation.isPending ? deleteTarget?.id ?? null : null}
              onDelete={setDeleteTarget}
            />
          )}

          <Pagination
            page={filters.page}
            pageSize={filters.pageSize}
            total={total}
            disabled={wasteSessionsQuery.isFetching}
            pageSizeId="waste-sessions-page-size"
            onPageChange={(nextPage) => setFilters({ page: nextPage })}
            onPageSizeChange={handlePageSizeChange}
          />
      </SectionCard>

      <CreateWasteSessionDialog
        open={isCreateOpen}
        pending={createWasteSessionMutation.isPending}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateWasteSession}
      />

      <Suspense fallback={null}>
        <DeleteWasteSessionDialog
          open={deleteTarget !== null}
          pending={deleteWasteSessionMutation.isPending}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onConfirm={handleDeleteWasteSession}
        />
      </Suspense>
    </section>
  );
}
