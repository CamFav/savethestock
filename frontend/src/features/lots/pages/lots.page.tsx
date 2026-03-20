import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, PackageOpen, Plus, Search, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategoriesList } from "@/features/categories/api/categories.queries";
import { useCreateLot, useDeleteLot, useLotsList, useUpdateLot } from "@/features/lots/api/lots.queries";
import { DeleteLotDialog } from "@/features/lots/components/DeleteLotDialog";
import { LotDialog } from "@/features/lots/components/LotDialog";
import { LotsFilters } from "@/features/lots/components/LotsFilters";
import { LotsPageSkeleton } from "@/features/lots/components/LotsPageSkeleton";
import { LotsTable } from "@/features/lots/components/LotsTable";
import type { LotListItem } from "@/features/lots/lots.types";
import { useProductsAll } from "@/features/products/api/products.queries";
import type { Product } from "@/features/products/api/products.types";
import { useReceptionsList } from "@/features/receptions/api/receptions.queries";
import type { ApiError } from "@/shared/api/apiClient";
import { useUrlQueryFilters } from "@/shared/routing/use-url-query-filters";
import { Pagination } from "@/shared/ui/pagination";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionCard } from "@/shared/ui/section-card";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; lot: LotListItem }
  | null;

type StockProductRow = {
  product: Product;
  categoryName: string;
  quantityAvailable: number;
  stockValue: number;
  lotsCount: number;
  latestUnitCost: number | null;
  needsAttention: boolean;
};

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 404) return "Lot introuvable.";
  if (error.status === 409) return "Ce lot entre en conflit avec des donnees existantes.";
  if (error.status === 400) return error.message ?? "Requete invalide.";
  if (error.status === 401) return "Votre session a expiré.";
  return error.message ?? fallback;
}

function withProductNames(items: LotListItem[], productMap: Record<string, string>): LotListItem[] {
  return items.map((item) => ({
    ...item,
    productName: productMap[item.productId] ?? "Produit inconnu",
  }));
}

function isExpired(value?: string): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

function applyLocalFilters(
  items: LotListItem[],
  q: string,
  showOnlyIssues: boolean,
  showExpired: boolean,
  expiringBefore?: string,
): LotListItem[] {
  const search = q.trim().toLowerCase();
  const expiringBeforeDate = expiringBefore ? new Date(expiringBefore) : null;

  return items.filter((item) => {
    if (showOnlyIssues && !item.hasIssue) return false;
    if (showExpired && !isExpired(item.expiryDate)) return false;
    if (expiringBeforeDate && item.expiryDate) {
      const expiry = new Date(item.expiryDate);
      if (!Number.isNaN(expiry.getTime()) && expiry > expiringBeforeDate) return false;
    }

    if (!search) return true;

    const product = item.productName?.toLowerCase() ?? "";
    const lotCode = item.lotCode?.toLowerCase() ?? "";
    return product.includes(search) || lotCode.includes(search) || item.id.toLowerCase().includes(search);
  });
}

function formatCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "Non renseigne";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function getProductRows(products: Product[], lots: LotListItem[], categoryNameById: Record<string, string>): StockProductRow[] {
  const lotsByProduct = new Map<string, LotListItem[]>();

  for (const lot of lots) {
    const current = lotsByProduct.get(lot.productId) ?? [];
    current.push(lot);
    lotsByProduct.set(lot.productId, current);
  }

  return products
    .map((product) => {
      const productLots = lotsByProduct.get(product.id) ?? [];
      const quantityAvailable = productLots.reduce((sum, lot) => sum + Math.max(lot.quantityRemaining ?? lot.quantityInitial, 0), 0);
      const pricedLots = productLots.filter((lot) => typeof lot.unitCost === "number");
      const stockValue = pricedLots.reduce((sum, lot) => sum + Math.max(lot.quantityRemaining ?? lot.quantityInitial, 0) * (lot.unitCost ?? 0), 0);
      const latestUnitCost = pricedLots.length > 0 ? pricedLots[pricedLots.length - 1].unitCost ?? null : null;

      return {
        product,
        categoryName: categoryNameById[product.categoryId] ?? "Sans catégorie",
        quantityAvailable,
        stockValue,
        lotsCount: productLots.length,
        latestUnitCost,
        needsAttention: quantityAvailable <= product.alertThreshold,
      };
    })
    .sort((left, right) => {
      if (left.needsAttention !== right.needsAttention) {
        return left.needsAttention ? -1 : 1;
      }

      return left.product.name.localeCompare(right.product.name, "fr-FR");
    });
}

export function LotsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, setFilters, resetFilters } = useUrlQueryFilters({ defaultPage: 1, defaultPageSize: 10 });
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [showExpired, setShowExpired] = useState(filters.expired);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<LotListItem | null>(null);

  const currentView = useMemo(() => {
    const explicitView = searchParams.get("view");
    if (explicitView === "lots") {
      return "lots";
    }
    if (explicitView === "products") {
      return "products";
    }
    if (filters.expired || filters.expiringBefore) {
      return "lots";
    }
    return "products";
  }, [filters.expired, filters.expiringBefore, searchParams]);

  const pagedLotsParams = useMemo(
    () => ({
      page: filters.page,
      pageSize: filters.pageSize,
      productId: filters.productId || undefined,
    }),
    [filters.page, filters.pageSize, filters.productId],
  );

  const summaryLotsParams = useMemo(
    () => ({
      page: 1,
      pageSize: 500,
      productId: filters.productId || undefined,
    }),
    [filters.productId],
  );

  const receptionsParams = useMemo(() => ({ page: 1, pageSize: 200 }), []);

  const pagedLotsQuery = useLotsList(pagedLotsParams);
  const summaryLotsQuery = useLotsList(summaryLotsParams);
  const productsQuery = useProductsAll();
  const categoriesQuery = useCategoriesList({ page: 1, pageSize: 200 });
  const receptionsQuery = useReceptionsList(receptionsParams);
  const createLotMutation = useCreateLot();
  const updateLotMutation = useUpdateLot();
  const deleteLotMutation = useDeleteLot();

  const products = productsQuery.data?.items ?? [];
  const receptions = receptionsQuery.data?.items ?? [];
  const categories = categoriesQuery.data?.items ?? [];

  const totalLots = pagedLotsQuery.data?.total ?? 0;
  const pagedLots = pagedLotsQuery.data?.items ?? [];
  const summaryLots = summaryLotsQuery.data?.items ?? [];

  const productNameById = useMemo(() => {
    return products.reduce<Record<string, string>>((acc, product) => {
      acc[product.id] = product.name;
      return acc;
    }, {});
  }, [products]);

  const categoryNameById = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categories]);

  const lotRows = useMemo(() => {
    const withNames = withProductNames(pagedLots, productNameById);
    return applyLocalFilters(withNames, filters.q, showOnlyIssues, showExpired, filters.expiringBefore);
  }, [filters.expiringBefore, filters.q, pagedLots, productNameById, showOnlyIssues, showExpired]);

  const productRows = useMemo(() => {
    return getProductRows(products, summaryLots, categoryNameById).filter((row) => {
      if (filters.categoryId && row.product.categoryId !== filters.categoryId) {
        return false;
      }

      if (filters.lowStock && !row.needsAttention) {
        return false;
      }

      if (!filters.q.trim()) {
        return true;
      }

      const search = filters.q.trim().toLowerCase();
      return (
        row.product.name.toLowerCase().includes(search) ||
        row.categoryName.toLowerCase().includes(search) ||
        row.product.unit.toLowerCase().includes(search)
      );
    });
  }, [categoryNameById, filters.categoryId, filters.lowStock, filters.q, products, summaryLots]);

  const totalStockValue = useMemo(() => {
    return productRows.reduce((sum, row) => sum + row.stockValue, 0);
  }, [productRows]);

  const productsToWatchCount = useMemo(() => {
    return productRows.filter((row) => row.needsAttention).length;
  }, [productRows]);

  useEffect(() => {
    setShowExpired(filters.expired);
  }, [filters.expired]);

  const pendingDeleteId = deleteLotMutation.isPending ? deleteTarget?.id ?? null : null;
  const editTarget = dialogState?.mode === "edit" ? dialogState.lot : null;

  const setView = useCallback(
    (nextView: "products" | "lots") => {
      const next = new URLSearchParams(searchParams);
      if (nextView === "products") {
        next.delete("view");
      } else {
        next.set("view", "lots");
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleSaveLot = useCallback(
    async (values: {
      productId: string;
      quantityInitial: number;
      receptionId?: string;
      lotCode?: string;
      expiryDate?: string;
      unitCost?: number;
      hasIssue: boolean;
      issueNote?: string;
    }) => {
      try {
        if (dialogState?.mode === "edit" && editTarget) {
          await updateLotMutation.mutateAsync({
            id: editTarget.id,
            receptionId: values.receptionId,
            lotCode: values.lotCode,
            expiryDate: values.expiryDate,
            unitCost: values.unitCost,
            hasIssue: values.hasIssue,
            issueNote: values.issueNote,
          });
        toast.success("Lot mis à jour.");
        } else {
          const created = await createLotMutation.mutateAsync({
            productId: values.productId,
            quantityInitial: values.quantityInitial,
            receptionId: values.receptionId,
            lotCode: values.lotCode,
            expiryDate: values.expiryDate,
            unitCost: values.unitCost,
          });

          if (values.hasIssue || values.issueNote) {
            await updateLotMutation.mutateAsync({
              id: created.id,
              receptionId: created.receptionId,
              lotCode: created.lotCode,
              expiryDate: created.expiryDate,
              unitCost: created.unitCost,
              hasIssue: values.hasIssue,
              issueNote: values.issueNote,
            });
          }

          toast.success("Lot ajoute.");
          setFilters({ page: 1 });
        }

        setDialogState(null);
      } catch (error) {
        toast.error(getApiErrorMessage(error as ApiError, "Impossible d'enregistrer le lot."));
      }
    },
    [createLotMutation, dialogState?.mode, editTarget, setFilters, updateLotMutation],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      await deleteLotMutation.mutateAsync({
        id: deleteTarget.id,
        receptionId: deleteTarget.receptionId,
      });
      toast.success("Lot supprime.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error as ApiError, "Impossible de supprimer le lot."));
    }
  }, [deleteLotMutation, deleteTarget]);

  const handleResetFilters = useCallback(() => {
    resetFilters();
    setShowOnlyIssues(false);
    setShowExpired(false);
  }, [resetFilters]);

  const handlePageSizeChange = useCallback(
    (nextPageSize: number) => {
      setFilters({ pageSize: nextPageSize, page: 1 });
    },
    [setFilters],
  );

  const handleProductChange = useCallback(
    (value: string) => {
      setFilters({ productId: value, page: 1 });
    },
    [setFilters],
  );

  if (pagedLotsQuery.isLoading || summaryLotsQuery.isLoading || productsQuery.isLoading || receptionsQuery.isLoading || categoriesQuery.isLoading) {
    return <LotsPageSkeleton />;
  }

  if (pagedLotsQuery.isError || summaryLotsQuery.isError || productsQuery.isError || receptionsQuery.isError || categoriesQuery.isError) {
    const apiError = (
      pagedLotsQuery.error ??
      summaryLotsQuery.error ??
      productsQuery.error ??
      receptionsQuery.error ??
      categoriesQuery.error
    ) as unknown as ApiError;

    return (
      <section className="page-shell">
        <PageHeader title="Stock" description="Vue globale du stock actuel, d'abord par produit puis par lots si besoin." />
        <SectionCard title="Impossible de charger le stock" description={getApiErrorMessage(apiError, "Une erreur inattendue est survenue.")}>
          <Button
            onClick={() =>
              void Promise.all([
                pagedLotsQuery.refetch(),
                summaryLotsQuery.refetch(),
                productsQuery.refetch(),
                receptionsQuery.refetch(),
                categoriesQuery.refetch(),
              ])
            }
          >
            Reessayer
          </Button>
        </SectionCard>
      </section>
    );
  }

  return (
    <section className="page-shell-wide space-y-6">
      <PageHeader
        title="Stock"
        description="Commencez par les produits pour comprendre le niveau réel, puis ouvrez les lots quand vous avez besoin du détail."
        actions={
          <>
            <Button asChild>
              <Link to="/app/receptions?create=1">
                <Plus className="h-4 w-4" />
                Nouvelle réception
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setDialogState({ mode: "create" })}>
              <Plus className="h-4 w-4" />
              Nouveau lot
            </Button>
          </>
        }
      />

      <section className="page-hero border-border/70 bg-[linear-gradient(135deg,#f2f6f2_0%,#fbfdfb_55%,#e4efe6_100%)]">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setView("products")}
                className={currentView === "products" ? "rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background" : "rounded-full px-4 py-2 text-sm font-medium text-foreground/70"}
              >
                Vue produits
              </button>
              <button
                type="button"
                onClick={() => setView("lots")}
                className={currentView === "lots" ? "rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background" : "rounded-full px-4 py-2 text-sm font-medium text-foreground/70"}
              >
                Vue lots
              </button>
            </div>

            <div>
              <p className="page-eyebrow">Situation actuelle</p>
              <h1 className="page-title">{currentView === "products" ? "Lecture par produit" : "Lecture par lots"}</h1>
              <p className="page-description">
                {currentView === "products"
                  ? "Produits : vue d'ensemble du stock disponible, pour savoir rapidement ce qu'il reste de chaque produit."
                  : "Lots : détail des lots et des dates, pour contrôler l'origine, la péremption et la réception d'origine."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-border/70 bg-white/85 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Produits visibles</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">{productRows.length}</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-white/85 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Valeur de stock</p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">{formatCurrency(totalStockValue)}</p>
            </div>
            <div className="rounded-[24px] border border-border/70 bg-white/85 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">A surveiller</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">{productsToWatchCount}</p>
            </div>
          </div>
        </div>
      </section>

      {currentView === "products" ? (
        <SectionCard title="Produits en stock" description="Cherchez un produit, filtrez par catégorie et ouvrez son détail si besoin." contentClassName="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_170px]">
            <label className="group block">
              <span className="mb-2 block text-sm font-medium text-foreground">Recherche produit</span>
              <div className="flex h-12 items-center gap-3 rounded-[18px] border border-border bg-background px-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={filters.q}
                  onChange={(event) => setFilters({ q: event.target.value, page: 1 })}
                  className="h-auto border-0 bg-transparent px-0 py-0 shadow-none ring-0 focus-visible:ring-0"
                  placeholder="Ex. mozzarella, huile, farine"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-medium text-foreground">Categorie</span>
              <select
                className="h-12 w-full rounded-[18px] border border-input bg-background px-3 text-sm"
                value={filters.categoryId}
                onChange={(event) => setFilters({ categoryId: event.target.value, page: 1 })}
              >
                <option value="">Toutes les catégories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-2">
              <Button
                variant={filters.lowStock ? "default" : "outline"}
                className="w-full"
                onClick={() => setFilters({ lowStock: !filters.lowStock, page: 1 })}
              >
                {filters.lowStock ? "Tous les produits" : "A surveiller"}
              </Button>
            </div>
          </div>

          {productRows.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <p className="text-sm font-medium text-foreground">Aucun produit à afficher</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Modifiez la recherche ou les filtres pour retrouver vos produits.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/70 bg-background/80">
              <table className="w-full text-sm">
                <thead className="border-b border-border/70 bg-muted/30 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Produit</th>
                    <th className="px-4 py-3 font-medium">Categorie</th>
                    <th className="px-4 py-3 font-medium">Disponible</th>
                    <th className="px-4 py-3 font-medium">Prix</th>
                    <th className="px-4 py-3 font-medium">Valeur</th>
                    <th className="px-4 py-3 font-medium">Lots</th>
                    <th className="px-4 py-3 font-medium text-right">Acces</th>
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((row) => (
                    <tr key={row.product.id} className="border-b border-border/50 last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={row.needsAttention ? "rounded-full bg-amber-100 p-2 text-amber-800" : "rounded-full bg-emerald-100 p-2 text-emerald-700"}>
                            {row.needsAttention ? <PackageOpen className="h-4 w-4" /> : <Warehouse className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{row.product.name}</p>
                            <p className="text-xs text-muted-foreground">{row.product.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{row.categoryName}</td>
                      <td className="px-4 py-3">
                        {formatQuantity(row.quantityAvailable)} {row.product.unit}
                        {row.needsAttention ? (
                          <span className="ml-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                            A surveiller
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">{formatCurrency(row.latestUnitCost)}</td>
                      <td className="px-4 py-3">{formatCurrency(row.stockValue)}</td>
                      <td className="px-4 py-3">{row.lotsCount}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/app/catalog?view=lots&productId=${row.product.id}`}>Voir les lots</Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link to={`/app/catalog/${row.product.id}`}>
                              Détail
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      ) : (
        <SectionCard title="Lots en stock" description={`${totalLots} lot${totalLots > 1 ? "s" : ""}`} contentClassName="space-y-4">
          <LotsFilters
            products={products}
            productId={filters.productId}
            expiringBefore={filters.expiringBefore}
            showOnlyIssues={showOnlyIssues}
            showExpired={showExpired}
            disabled={pagedLotsQuery.isFetching}
            onProductChange={handleProductChange}
            onExpiringBeforeChange={(value) => setFilters({ expiringBefore: value, page: 1 })}
            onShowOnlyIssuesChange={(value) => setShowOnlyIssues(value)}
            onShowExpiredChange={(value) => {
              setShowExpired(value);
              setFilters({ expired: value, page: 1 });
            }}
            onReset={handleResetFilters}
          />

          <label className="group block">
            <span className="mb-2 block text-sm font-medium text-foreground">Recherche lot</span>
            <div className="flex h-12 items-center gap-3 rounded-[18px] border border-border bg-background px-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={filters.q}
                onChange={(event) => setFilters({ q: event.target.value, page: 1 })}
                className="h-auto border-0 bg-transparent px-0 py-0 shadow-none ring-0 focus-visible:ring-0"
                placeholder="Ex. lot, produit, code"
              />
            </div>
          </label>

          {lotRows.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <p className="text-sm font-medium text-foreground">Aucun lot à afficher</p>
              <p className="mt-1 text-sm text-muted-foreground">Les lots correspondent aux quantites recues et suivies dans le temps.</p>
              <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
                <Button asChild>
                  <Link to="/app/receptions?create=1">Nouvelle réception</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/app/receptions">Voir les réceptions</Link>
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Pour une entrée fournisseur, passez de préférence par une réception.</p>
            </div>
          ) : (
            <LotsTable
              items={lotRows}
              pendingDeleteId={pendingDeleteId}
              onEdit={(lot) => setDialogState({ mode: "edit", lot })}
              onDelete={setDeleteTarget}
              showReception
            />
          )}

          <Pagination
            page={filters.page}
            pageSize={filters.pageSize}
            total={totalLots}
            disabled={pagedLotsQuery.isFetching}
            pageSizeId="lots-page-size"
            onPageChange={(nextPage) => setFilters({ page: nextPage })}
            onPageSizeChange={handlePageSizeChange}
          />
        </SectionCard>
      )}

      <LotDialog
        open={dialogState !== null}
        mode={dialogState?.mode === "edit" ? "edit" : "create"}
        products={products}
        receptions={receptions}
        defaultLot={editTarget}
        pending={createLotMutation.isPending || updateLotMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setDialogState(null);
        }}
        onSubmit={handleSaveLot}
      />

      <DeleteLotDialog
        open={deleteTarget !== null}
        productName={deleteTarget?.productName}
        pending={deleteLotMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </section>
  );
}
