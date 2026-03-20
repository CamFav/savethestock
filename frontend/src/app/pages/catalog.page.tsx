import { useCallback, useDeferredValue, useEffect, useMemo, useState, startTransition } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Boxes, FolderTree, PackagePlus, Pencil, Search, ShoppingBasket, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCategoriesList } from "@/features/categories/api/categories.queries";
import { useDashboardAlerts } from "@/features/dashboard/api/dashboard.queries";
import { useLotsList } from "@/features/lots/api/lots.queries";
import { getProductStockFromLots } from "@/features/lots/lots-stock.utils";
import type { LotListItem } from "@/features/lots/lots.types";
import {
  useCreateProduct,
  useDeleteProduct,
  useProductsList,
  useUpdateProduct,
} from "@/features/products/api/products.queries";
import type { Product } from "@/features/products/api/products.types";
import { DeleteProductDialog } from "@/features/products/components/DeleteProductDialog";
import { ProductDialog } from "@/features/products/components/ProductDialog";
import { useOrdersStore } from "@/features/orders/orders.store";
import type { ApiError } from "@/shared/api/apiClient";
import { isOwnerRole } from "@/shared/auth/roles";
import { useSessionStore } from "@/shared/auth/sessionStore";
import { ModuleHeroHeader } from "@/shared/ui/module-hero-header";
import { PageHeader } from "@/shared/ui/page-header";
import { ReadonlyNotice } from "@/shared/ui/readonly-notice";
import { SectionCard } from "@/shared/ui/section-card";

export type CatalogOutletContext = {
  embedded: boolean;
};

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; product: Product }
  | null;

type ProductStockSummary = {
  quantityAvailable: number;
  expiredQuantity: number;
  unitPrice: number | null;
  stockValue: number;
};

type ProductStockStateLabel = {
  tone: string;
  label: string;
  help: string;
};

const PRODUCTS_PAGE_SIZE = 200;
const LOTS_PAGE_SIZE = 500;

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 409) {
    const message = error.message?.toLowerCase() ?? "";
    if (message.includes("duplicate_name") || message.includes("already exists") || message.includes("already used")) {
      return "Un produit portant ce nom existe déjà.";
    }
  }

  if (error.status === 404) return "Produit introuvable.";
  if (error.status === 400) return error.message ?? "Requête invalide.";
  if (error.status === 401) return "Votre session a expiré.";
  return error.message ?? fallback;
}

function formatCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "Prix non renseigné";
  }

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

function getStockSummaryByProduct(lots: LotListItem[]): Map<string, ProductStockSummary> {
  const lotsByProduct = new Map<string, LotListItem[]>();

  for (const lot of lots) {
    if (!lot.productId) {
      continue;
    }

    const entries = lotsByProduct.get(lot.productId) ?? [];
    entries.push(lot);
    lotsByProduct.set(lot.productId, entries);
  }

  const summaries = new Map<string, ProductStockSummary>();
  for (const [productId, productLots] of lotsByProduct.entries()) {
    const stock = getProductStockFromLots(productLots);
    summaries.set(productId, {
      quantityAvailable: stock.availableQuantity,
      expiredQuantity: stock.expiredQuantity,
      unitPrice: stock.latestUnitPrice,
      stockValue: stock.availableValue,
    });
  }

  return summaries;
}

function getProductStockStateLabel(product: Product, stockSummary: ProductStockSummary, lowStockProductIds: Set<string>): ProductStockStateLabel {
  const isLowStock = lowStockProductIds.has(product.id) || stockSummary.quantityAvailable <= product.alertThreshold;
  const isOutOfStock = stockSummary.quantityAvailable <= 0;

  if (isOutOfStock) {
    return {
      tone: "border border-red-200 bg-red-50 text-red-700",
      label: "Rupture",
      help: "Plus rien en stock.",
    };
  }

  if (isLowStock) {
    return {
      tone: "border border-amber-200 bg-amber-50 text-amber-800",
      label: "Seuil",
      help: "Stock proche du seuil.",
    };
  }

  return {
    tone: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    label: "OK",
    help: "Disponible pour le service.",
  };
}

function ProductCard({
  canManage,
  categoryName,
  onDelete,
  onEdit,
  onAddToOrder,
  product,
  quantityInDraft,
  stockSummary,
  stockStateLabel,
}: {
  canManage: boolean;
  categoryName: string;
  onDelete: (product: Product) => void;
  onEdit: (product: Product) => void;
  onAddToOrder: (product: Product, unitPrice: number | null) => void;
  product: Product;
  quantityInDraft: number;
  stockSummary: ProductStockSummary;
  stockStateLabel: ProductStockStateLabel;
}) {
  return (
    <article className="relative overflow-hidden rounded-[28px] border border-border/80 bg-card p-5 shadow-[0_16px_50px_-38px_rgba(15,23,42,0.38)] transition-transform duration-200 hover:-translate-y-0.5">
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-foreground/12 to-transparent" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <Tag className="h-3 w-3" />
              {categoryName}
            </span>
            {!product.isActive ? (
              <span className="inline-flex rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                Produit masque
              </span>
            ) : null}
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">{product.name}</h2>
          </div>
        </div>

        <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium", stockStateLabel.tone)}>{stockStateLabel.label}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-muted/70 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Prix unitaire</p>
          <p className="mt-2 text-base font-semibold text-foreground">{formatCurrency(stockSummary.unitPrice)}</p>
        </div>

        <div className="rounded-2xl bg-muted/70 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Stock disponible</p>
          <p className="mt-2 text-base font-semibold text-foreground">
            {formatQuantity(stockSummary.quantityAvailable)} {product.unit}
          </p>
          {stockSummary.expiredQuantity > 0 ? (
            <p className="mt-1 text-xs text-amber-700">
              {formatQuantity(stockSummary.expiredQuantity)} {product.unit} en lots expirés
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-muted/70 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Valeur du stock</p>
          <p className="mt-2 text-base font-semibold text-foreground">{formatCurrency(stockSummary.stockValue)}</p>
        </div>

        <div className="rounded-2xl bg-muted/70 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Repere</p>
          <p className="mt-2 text-sm font-medium text-foreground">{stockStateLabel.help}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 text-sm text-amber-900">
          <ShoppingBasket className="h-4 w-4" />
          {quantityInDraft > 0 ? `${quantityInDraft} en commande` : "Pas encore commandé"}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" className="min-w-[148px]">
            <Link to={`/app/catalog/${product.id}`}>
              Voir le détail
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button className="min-w-[156px]" onClick={() => onAddToOrder(product, stockSummary.unitPrice)}>
            <PackagePlus className="h-4 w-4" />Ajouter à la commande
          </Button>
        </div>
      </div>

      {canManage ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-4">
          <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
            <Pencil className="h-4 w-4" />Modifier
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(product)}>
            <Trash2 className="h-4 w-4" />Retirer
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export function CatalogPage() {
  const role = useSessionStore((s) => s.role);
  const canManage = isOwnerRole(role);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(searchParams.get("categoryId") ?? "all");
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const deferredSearchValue = useDeferredValue(searchValue);
  const orders = useOrdersStore((state) => state.orders);
  const addProductToDraftOrder = useOrdersStore((state) => state.addProductToDraftOrder);

  const categoriesQuery = useCategoriesList({ page: 1, pageSize: 200 });
  const productsQuery = useProductsList({ page: 1, pageSize: PRODUCTS_PAGE_SIZE });
  const lotsQuery = useLotsList({ page: 1, pageSize: LOTS_PAGE_SIZE });
  const dashboardAlertsQuery = useDashboardAlerts({ expiryDays: 3 });
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const categories = categoriesQuery.data?.items ?? [];
  const products = productsQuery.data?.items ?? [];
  const lots = lotsQuery.data?.items ?? [];
  const hasCategories = categories.length > 0;

  const lowStockProductIds = useMemo(() => {
    return new Set((dashboardAlertsQuery.data?.lowStockProducts ?? []).map((item) => item.productId));
  }, [dashboardAlertsQuery.data?.lowStockProducts]);

  const categoryNameById = useMemo(() => {
    return categories.reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categories]);

  const stockSummaryByProduct = useMemo(() => getStockSummaryByProduct(lots), [lots]);

  const categoryChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }

    return [
      { id: "all", name: "Tout le catalogue", count: products.length },
      ...categories.map((category) => ({
        id: category.id,
        name: category.name,
        count: counts.get(category.id) ?? 0,
      })),
    ];
  }, [categories, products]);

  const updateCatalogParams = useCallback(
    (patch: {
      q?: string | null;
      categoryId?: string | null;
    }) => {
      const next = new URLSearchParams(searchParams);
      next.delete("view");
      next.delete("productId");
      next.delete("expired");
      next.delete("expiringBefore");

      if ("q" in patch) {
        if (patch.q && patch.q.trim()) next.set("q", patch.q);
        else next.delete("q");
      }

      if ("categoryId" in patch) {
        if (patch.categoryId && patch.categoryId !== "all") next.set("categoryId", patch.categoryId);
        else next.delete("categoryId");
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (
      searchParams.has("view") ||
      searchParams.has("productId") ||
      searchParams.has("expired") ||
      searchParams.has("expiringBefore")
    ) {
      const next = new URLSearchParams(searchParams);
      next.delete("view");
      next.delete("productId");
      next.delete("expired");
      next.delete("expiringBefore");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = deferredSearchValue.trim().toLocaleLowerCase("fr-FR");

    return products.filter((product) => {
      if (selectedCategoryId !== "all" && product.categoryId !== selectedCategoryId) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return product.name.toLocaleLowerCase("fr-FR").includes(normalizedQuery);
    });
  }, [deferredSearchValue, products, selectedCategoryId]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((left: Product, right: Product) => {
      const leftSummary = stockSummaryByProduct.get(left.id) ?? { quantityAvailable: 0, expiredQuantity: 0, unitPrice: null, stockValue: 0 };
      const rightSummary = stockSummaryByProduct.get(right.id) ?? { quantityAvailable: 0, expiredQuantity: 0, unitPrice: null, stockValue: 0 };
      const leftNeedsAttention = lowStockProductIds.has(left.id) || leftSummary.quantityAvailable <= left.alertThreshold;
      const rightNeedsAttention = lowStockProductIds.has(right.id) || rightSummary.quantityAvailable <= right.alertThreshold;

      if (leftNeedsAttention !== rightNeedsAttention) {
        return leftNeedsAttention ? -1 : 1;
      }

      return left.name.localeCompare(right.name, "fr-FR");
    });
  }, [filteredProducts, lowStockProductIds, stockSummaryByProduct]);

  const totalStockValue = useMemo(() => {
    return filteredProducts.reduce((sum, product) => sum + (stockSummaryByProduct.get(product.id)?.stockValue ?? 0), 0);
  }, [filteredProducts, stockSummaryByProduct]);

  const productsToWatchCount = useMemo(() => {
    return filteredProducts.filter((product) => {
      const quantityAvailable = stockSummaryByProduct.get(product.id)?.quantityAvailable ?? 0;
      return lowStockProductIds.has(product.id) || quantityAvailable <= product.alertThreshold;
    }).length;
  }, [filteredProducts, lowStockProductIds, stockSummaryByProduct]);

  const draftOrder = useMemo(() => orders.find((order) => order.status === "DRAFT") ?? null, [orders]);
  const quantityInDraftByProduct = useMemo(() => {
    const entries = draftOrder?.lines ?? [];
    return entries.reduce<Record<string, number>>((acc, line) => {
      acc[line.productId] = line.quantityOrdered;
      return acc;
    }, {});
  }, [draftOrder?.lines]);
  const dataLimitNotice = useMemo(() => {
    const notices: string[] = [];

    if ((productsQuery.data?.total ?? 0) > products.length) {
      notices.push(`Le catalogue affiche pour l'instant les ${products.length} premiers produits chargés.`);
    }

    if ((lotsQuery.data?.total ?? 0) > lots.length) {
      notices.push(`Le stock visible est calcule sur les ${lots.length} premiers lots chargés.`);
    }

    return notices.join(" ");
  }, [lots.length, lotsQuery.data?.total, products.length, productsQuery.data?.total]);

  const editTarget = dialogState?.mode === "edit" ? dialogState.product : null;

  const handleOpenCreate = useCallback(() => setDialogState({ mode: "create" }), []);
  const handleOpenEdit = useCallback((product: Product) => setDialogState({ mode: "edit", product }), []);
  const handleOpenDelete = useCallback((product: Product) => setDeleteTarget(product), []);
  const handleCloseDialog = useCallback(() => setDialogState(null), []);
  const handleCloseDeleteDialog = useCallback(() => setDeleteTarget(null), []);

  const handleSearchChange = useCallback(
    (value: string) => {
      startTransition(() => setSearchValue(value));
      updateCatalogParams({ q: value || null });
    },
    [updateCatalogParams],
  );

  const handleCategoryChange = useCallback(
    (nextCategoryId: string) => {
      setSelectedCategoryId(nextCategoryId);
      updateCatalogParams({ categoryId: nextCategoryId === "all" ? null : nextCategoryId });
    },
    [updateCatalogParams],
  );

  const handleAddToOrder = useCallback(
    (product: Product, unitPrice: number | null, quantity = 1) => {
      const orderId = addProductToDraftOrder({
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        quantity,
        unitPrice,
      });
      toast.success("Produit ajouté à la commande en brouillon.", {
        action: {
          label: "Ouvrir",
          onClick: () => {
            navigate(`/app/orders/${orderId}`);
          },
        },
      });
    },
    [addProductToDraftOrder, navigate],
  );

  const handleCreateOrUpdate = useCallback(
    async (values: { name: string; categoryId: string; unit: string; alertThreshold: number; isActive: boolean }) => {
      try {
        if (dialogState?.mode === "edit" && editTarget) {
          await updateProductMutation.mutateAsync({
            id: editTarget.id,
            categoryId: values.categoryId,
            name: values.name,
            unit: values.unit,
            alertThreshold: values.alertThreshold,
            isActive: values.isActive,
          });
          toast.success("Produit mis à jour.");
        } else {
          await createProductMutation.mutateAsync({
            categoryId: values.categoryId,
            name: values.name,
            unit: values.unit,
            alertThreshold: values.alertThreshold,
            isActive: values.isActive,
          });
          toast.success("Produit ajouté au catalogue.");
        }

        handleCloseDialog();
      } catch (error) {
        toast.error(getApiErrorMessage(error as ApiError, "Impossible d’enregistrer le produit."));
      }
    },
    [createProductMutation, dialogState?.mode, editTarget, handleCloseDialog, updateProductMutation],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteProductMutation.mutateAsync({ id: deleteTarget.id });
      toast.success("Produit retiré.");
      handleCloseDeleteDialog();
    } catch (error) {
      toast.error(getApiErrorMessage(error as ApiError, "Impossible de retirer le produit."));
    }
  }, [deleteProductMutation, deleteTarget, handleCloseDeleteDialog]);

  if (productsQuery.isLoading || categoriesQuery.isLoading || lotsQuery.isLoading) {
    return (
      <section className="page-shell-wide space-y-6">
        <div className="page-hero overflow-hidden">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              <div className="h-4 w-32 rounded-full bg-muted" />
              <div className="h-10 w-2/3 rounded-2xl bg-muted" />
              <div className="h-5 w-full max-w-2xl rounded-full bg-muted" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="h-28 rounded-[24px] bg-muted" />
              <div className="h-28 rounded-[24px] bg-muted" />
              <div className="h-28 rounded-[24px] bg-muted" />
            </div>
          </div>
        </div>

        <SectionCard contentClassName="space-y-4">
          <div className="h-14 rounded-[20px] bg-muted" />
          <div className="flex gap-3 overflow-hidden">
            <div className="h-11 w-36 rounded-full bg-muted" />
            <div className="h-11 w-28 rounded-full bg-muted" />
            <div className="h-11 w-32 rounded-full bg-muted" />
            <div className="h-11 w-24 rounded-full bg-muted" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <div className="h-72 rounded-[28px] bg-muted" />
            <div className="h-72 rounded-[28px] bg-muted" />
            <div className="h-72 rounded-[28px] bg-muted" />
          </div>
        </SectionCard>
      </section>
    );
  }

  if (productsQuery.isError || categoriesQuery.isError || lotsQuery.isError) {
    const apiError = (productsQuery.error ?? categoriesQuery.error ?? lotsQuery.error) as unknown as ApiError;

    return (
      <section className="page-shell">
        <PageHeader
          title="Catalogue"
          description="Cherchez un produit, vérifiez le stock et ajoutez-le à la commande."
        />

        <SectionCard title="Impossible d'ouvrir le catalogue" description={getApiErrorMessage(apiError, "Une erreur inattendue est survenue.")}>
          <Button onClick={() => void Promise.all([productsQuery.refetch(), categoriesQuery.refetch(), lotsQuery.refetch()])}>Réessayer</Button>
        </SectionCard>
      </section>
    );
  }

  return (
    <section className="page-shell-wide space-y-6">
      <ModuleHeroHeader
        eyebrow="Catalogue & stock réel"
        title="Catalogue"
        description="Cherchez un produit, vérifiez le stock et ajoutez-le à la commande."
        tone="catalog"
        actions={
          <>
            {canManage ? (
              <Button onClick={handleOpenCreate}>
                <PackagePlus className="h-4 w-4" />
                Nouveau produit
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to={draftOrder ? `/app/orders/${draftOrder.id}` : "/app/orders"}>
                <ShoppingBasket className="h-4 w-4" />
                {draftOrder ? "Ouvrir la commande" : "Voir les commandes"}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/app/categories">
                <FolderTree className="h-4 w-4" />
                Gérer les catégories
              </Link>
            </Button>
          </>
        }
        stats={[
          {
            label: "Produits actifs",
            value: filteredProducts.length,
            help: "Vos produits actifs",
          },
          {
            label: "Valeur en stock",
            value: formatCurrency(totalStockValue),
            help: "Sur les produits affichés",
          },
          {
            label: "À surveiller",
            value: productsToWatchCount,
            help: "Produits proches du seuil",
          },
        ]}
      />

      <SectionCard
        className="overflow-hidden border-border/70"
        contentClassName="space-y-4"
        title="Produits"
        description="Cherchez, filtrez et ouvrez les produits utiles."
      >
        <label className="group block">
          <div className="flex h-14 items-center gap-3 rounded-[20px] border border-border bg-background px-4 shadow-[0_12px_32px_-30px_rgba(15,23,42,0.5)] transition-colors group-focus-within:border-foreground/30">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="h-auto border-0 bg-transparent px-0 py-0 text-base shadow-none ring-0 focus-visible:ring-0"
              placeholder="Ex. mozzarella, tomates, farine"
            />
          </div>
        </label>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {categoryChips.map((category) => {
            const isActive = selectedCategoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryChange(category.id)}
                className={cn(
                  "inline-flex min-w-fit items-center gap-3 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:border-foreground/30 hover:bg-muted",
                )}
              >
                <span>{category.name}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs", isActive ? "bg-white/18 text-white" : "bg-muted text-muted-foreground")}>
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>

        {!canManage ? <ReadonlyNotice /> : null}
        {dataLimitNotice ? <p className="text-xs text-muted-foreground">{dataLimitNotice}</p> : null}
      </SectionCard>

      {!hasCategories ? (
        <SectionCard
          title="Le catalogue a besoin d'au moins une catégorie"
          description="Classez d'abord les familles de produits pour construire un catalogue exploitable."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link to="/app/categories">
                <Boxes className="h-4 w-4" />Ouvrir les catégories
              </Link>
            </Button>
            {!canManage ? <p className="text-sm text-muted-foreground">Cette organisation se gère par le propriétaire.</p> : null}
          </div>
        </SectionCard>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            {sortedProducts.length === 0 ? (
              <SectionCard
                title="Aucun produit ne correspond à cette recherche"
                description={searchValue ? "Essayez un autre nom ou revenez sur toutes les catégories." : "Ajoutez le premier produit pour lancer le catalogue."}
              >
                <div className="flex flex-wrap items-center gap-3">
                  {searchValue || selectedCategoryId !== "all" ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCategoryId("all");
                        setSearchValue("");
                        updateCatalogParams({ q: null, categoryId: null });
                      }}
                    >
                      Revenir à tout le catalogue
                    </Button>
                  ) : null}
                  {canManage ? <Button onClick={handleOpenCreate}>Ajouter un produit</Button> : null}
                </div>
              </SectionCard>
            ) : (
              <section className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Liste produits</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-foreground">Produits à consulter et à commander</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sortedProducts.length} produit(s) affiché(s) sur {products.length}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {sortedProducts.map((product: Product) => {
                    const stockSummary = stockSummaryByProduct.get(product.id) ?? {
                      quantityAvailable: 0,
                      expiredQuantity: 0,
                      unitPrice: null,
                      stockValue: 0,
                    };
                    const stockStateLabel = getProductStockStateLabel(product, stockSummary, lowStockProductIds);

                    return (
                      <ProductCard
                        key={product.id}
                        canManage={canManage}
                        categoryName={categoryNameById[product.categoryId] ?? "Sans catégorie"}
                        onDelete={handleOpenDelete}
                        onEdit={handleOpenEdit}
                        onAddToOrder={handleAddToOrder}
                        product={product}
                        quantityInDraft={quantityInDraftByProduct[product.id] ?? 0}
                        stockStateLabel={stockStateLabel}
                        stockSummary={stockSummary}
                      />
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-3 xl:sticky xl:top-24 xl:self-start">
            {dataLimitNotice ? <p className="text-xs text-muted-foreground">{dataLimitNotice}</p> : null}
          </aside>
        </div>
      )}

      {canManage ? (
        <>
          <ProductDialog
            open={dialogState !== null}
            mode={dialogState?.mode === "edit" ? "edit" : "create"}
            categories={categories}
            defaultProduct={editTarget}
            onOpenChange={(open) => {
              if (!open) {
                handleCloseDialog();
              }
            }}
            onSubmit={handleCreateOrUpdate}
          />

          <DeleteProductDialog
            open={deleteTarget !== null}
            productName={deleteTarget?.name}
            pending={deleteProductMutation.isPending}
            onOpenChange={(open) => {
              if (!open) {
                handleCloseDeleteDialog();
              }
            }}
            onConfirm={handleConfirmDelete}
          />
        </>
      ) : null}
    </section>
  );
}
