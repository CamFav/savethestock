import { useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportInventoriesCsv, upsertInventoryLine } from "@/features/inventories/api/inventories.api";
import { useCreateInventory, useInventoriesList } from "@/features/inventories/api/inventories.queries";
import { CreateInventoryDialog } from "@/features/inventories/components/create-inventory-dialog";
import { markInventoryLinesAsUntouched } from "@/features/inventories/inventory-draft-progress";
import { getInventorySeedProducts } from "@/features/inventories/inventory-stock.utils";
import { InventoriesTable } from "@/features/inventories/components/inventories-table";
import { useLotsList } from "@/features/lots/api/lots.queries";
import { useProductsAll } from "@/features/products/api/products.queries";
import { buildCsvFilename, downloadBlobFile } from "@/shared/files/download";
import { useUrlQueryFilters } from "@/shared/routing/use-url-query-filters";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";
import { Pagination } from "@/shared/ui/pagination";
import type { ApiError } from "@/shared/api/apiClient";
import { ModuleHeroHeader } from "@/shared/ui/module-hero-header";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionCard } from "@/shared/ui/section-card";

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

export function InventoriesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, setFilters, resetFilters } = useUrlQueryFilters({ defaultStatus: "all", defaultPage: 1, defaultPageSize: 10 });
  const createInventoryMutation = useCreateInventory();
  const isCreateOpen = searchParams.get("create") === "1";

  const params = useMemo(
    () => ({
      page: filters.page,
      pageSize: filters.pageSize,
      from: filters.from || undefined,
      to: filters.to || undefined,
      status: filters.status === "all" ? undefined : filters.status,
      productId: filters.productId || undefined,
    }),
    [filters],
  );

  const inventoriesQuery = useInventoriesList(params);
  const productsQuery = useProductsAll();
  const lotsQuery = useLotsList({ page: 1, pageSize: 1000 });
  const exportCsvMutation = useMutation({
    mutationFn: () =>
      exportInventoriesCsv({
        from: filters.from || undefined,
        to: filters.to || undefined,
        status: filters.status === "all" ? undefined : filters.status,
        productId: filters.productId || undefined,
      }),
  });

  const items = inventoriesQuery.data?.items ?? [];
  const total = inventoriesQuery.data?.total ?? 0;
  const products = productsQuery.data?.items ?? [];
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
      downloadBlobFile(blob, buildCsvFilename("inventories", filters.from || undefined, filters.to || undefined));
      toast.success("CSV exporté.");
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 404) {
        toast.error("L’export CSV n’est pas encore disponible côté API.");
        return;
      }
      toast.error(getApiErrorMessage(apiError, "Impossible d’exporter le CSV."));
    }
  }, [exportCsvMutation, filters.from, filters.status, filters.to, filters.productId]);

  const handlePageSizeChange = useCallback((nextPageSize: number) => {
    setFilters({ pageSize: nextPageSize, page: 1 });
  }, [setFilters]);

  const handleCreateInventory = useCallback(
    async (values: { inventoryDate: string; comment: string }) => {
      try {
        const products = productsQuery.data?.items ?? [];
        const lots = lotsQuery.data?.items ?? [];
        const created = await createInventoryMutation.mutateAsync({
          inventoryDate: values.inventoryDate,
          comment: values.comment.trim() || undefined,
        });

        const seedProducts = getInventorySeedProducts(products, lots);
        if (seedProducts.length > 0) {
          const createdLines = await Promise.all(
            seedProducts.map((product) =>
              upsertInventoryLine(created.id, {
                productId: product.id,
                realQuantity: 0,
              }),
            ),
          );

          markInventoryLinesAsUntouched(
            created.id,
            createdLines.map((line) => line.id),
          );
        }

        toast.success(
          seedProducts.length > 0
            ? `Inventaire créé avec ${seedProducts.length} produit(s) à compter.`
            : "Inventaire créé.",
        );
        navigate(`/app/inventories/${created.id}`, { replace: true });
      } catch (error) {
        const apiError = error as ApiError;
        toast.error(getApiErrorMessage(apiError, "Impossible de créer l’inventaire. Réessayez."));
      }
    },
    [createInventoryMutation, lotsQuery.data?.items, navigate, productsQuery.data?.items],
  );

  if (inventoriesQuery.isError) {
    const apiError = inventoriesQuery.error as unknown as ApiError;

    return (
      <section className="page-shell">
        <PageHeader title="Inventaires" description="Comptez le stock réel et corrigez les écarts." />
        <SectionCard
          title="Impossible de charger les inventaires"
          description={getApiErrorMessage(apiError, "Une erreur inattendue est survenue.")}
        >
          <Button onClick={() => inventoriesQuery.refetch()}>Réessayer</Button>
        </SectionCard>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <ModuleHeroHeader
        eyebrow="Contrôle du stock"
        title="Inventaires"
        description="Comptez le stock réel et corrigez les écarts."
        tone="inventories"
        actions={
          <>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Nouvel inventaire
            </Button>
            <Button variant="outline" onClick={() => void handleExportCsv()} disabled={exportCsvMutation.isPending}>
              <Download className="h-4 w-4" />
              {exportCsvMutation.isPending ? "Export..." : "Exporter CSV"}
            </Button>
          </>
        }
        stats={[
          { label: "Inventaires", value: total, help: "Dans la sélection actuelle" },
          { label: "Brouillons", value: draftCount, help: "À reprendre ou compléter" },
          { label: "Valides", value: validatedCount, help: "Inventaires déjà terminés" },
        ]}
      />

      <SectionCard title="Filtres" description="Affinez la liste par période, statut ou produit." contentClassName="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setFilters({ ...getPresetRange("7d"), page: 1 })}>7 jours</Button>
          <Button size="sm" variant="outline" onClick={() => setFilters({ ...getPresetRange("30d"), page: 1 })}>30 jours</Button>
          <Button size="sm" variant="outline" onClick={() => setFilters({ ...getPresetRange("thisMonth"), page: 1 })}>Ce mois</Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="inventory-from-date">Du</label>
            <Input
              id="inventory-from-date"
              type="date"
              value={filters.from}
              onChange={(event) => setFilters({ from: event.target.value, page: 1 })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="inventory-to-date">Au</label>
            <Input
              id="inventory-to-date"
              type="date"
              value={filters.to}
              onChange={(event) => setFilters({ to: event.target.value, page: 1 })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="inventory-status">Statut</label>
            <select
              id="inventory-status"
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
            <label className="text-xs text-muted-foreground" htmlFor="inventory-product">Produit</label>
            <select
              id="inventory-product"
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

          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" className="w-full" onClick={() => { resetFilters(); }}>
              Réinitialiser
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Liste des inventaires"
        description={`${total} session${total > 1 ? "s" : ""}`}
        contentClassName="space-y-4"
      >
          {inventoriesQuery.isLoading ? (
            <div className="space-y-2">
              <div className="h-10 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded bg-muted" />
            </div>
          ) : items.length === 0 ? (
            <EmptyStateCard
              title="Aucun inventaire pour le moment"
              description="Créez votre premier inventaire pour comparer le stock réel au stock théorique."
              ctaLabel="Nouvel inventaire"
              onCtaClick={() => setCreateOpen(true)}
            />
          ) : (
            <InventoriesTable items={items} />
          )}

          <Pagination
            page={filters.page}
            pageSize={filters.pageSize}
            total={total}
            disabled={inventoriesQuery.isFetching}
            pageSizeId="inventories-page-size"
            onPageChange={(nextPage) => setFilters({ page: nextPage })}
            onPageSizeChange={handlePageSizeChange}
          />
      </SectionCard>

      <CreateInventoryDialog
        open={isCreateOpen}
        pending={createInventoryMutation.isPending || productsQuery.isLoading || lotsQuery.isLoading}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateInventory}
      />
    </section>
  );
}
