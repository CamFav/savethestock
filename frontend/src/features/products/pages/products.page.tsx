import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { CatalogOutletContext } from "@/app/pages/catalog.page";
import { isOwnerRole } from "@/shared/auth/roles";
import { useSessionStore } from "@/shared/auth/sessionStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCategoriesList } from "@/features/categories/api/categories.queries";
import {
  useCreateProduct,
  useDeleteProduct,
  useProductsList,
  useUpdateProduct,
} from "@/features/products/api/products.queries";
import { useDashboardAlerts } from "@/features/dashboard/api/dashboard.queries";
import type { Product } from "@/features/products/api/products.types";
import { DeleteProductDialog } from "@/features/products/components/DeleteProductDialog";
import { Pagination } from "@/features/products/components/Pagination";
import { ProductDialog } from "@/features/products/components/ProductDialog";
import { ProductsFilters } from "@/features/products/components/ProductsFilters";
import { ProductsHeader } from "@/features/products/components/ProductsHeader";
import { ProductsPageSkeleton } from "@/features/products/components/ProductsPageSkeleton";
import { ProductsTable } from "@/features/products/components/ProductsTable";
import type { ApiError } from "@/shared/api/apiClient";
import { SectionCard } from "@/shared/ui/section-card";
import { ReadonlyNotice } from "@/shared/ui/readonly-notice";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; product: Product }
  | null;

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

export function ProductsPage() {
  const catalogContext = useOutletContext<CatalogOutletContext | null>();
  const embedded = catalogContext?.embedded ?? false;
  const role = useSessionStore((s) => s.role);
  const canManage = isOwnerRole(role);
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [categoryIdFilter, setCategoryIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const productsParams = useMemo(
    () => ({
      page,
      pageSize,
      categoryId: categoryIdFilter || undefined,
    }),
    [categoryIdFilter, page, pageSize],
  );

  const categoriesQuery = useCategoriesList({ page: 1, pageSize: 200 });
  const productsQuery = useProductsList(productsParams);
  const dashboardAlertsQuery = useDashboardAlerts({ expiryDays: 3 });
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const categories = categoriesQuery.data?.items ?? [];
  const hasCategories = categories.length > 0;
  const products = productsQuery.data?.items ?? [];
  const total = productsQuery.data?.total ?? 0;
  const lowStockOnly = searchParams.get("lowStock") === "true";
  const lowStockProductIds = useMemo(() => {
    const items = dashboardAlertsQuery.data?.lowStockProducts ?? [];
    return new Set(items.map((item) => item.productId));
  }, [dashboardAlertsQuery.data?.lowStockProducts]);

  const filteredProducts = useMemo(() => {
    const byLowStock = lowStockOnly ? products.filter((item) => lowStockProductIds.has(item.id)) : products;
    if (statusFilter === "active") {
      return byLowStock.filter((item) => item.isActive);
    }
    if (statusFilter === "inactive") {
      return byLowStock.filter((item) => !item.isActive);
    }
    return byLowStock;
  }, [lowStockOnly, lowStockProductIds, products, statusFilter]);

  const editTarget = dialogState?.mode === "edit" ? dialogState.product : null;
  const pendingDeleteId = deleteProductMutation.isPending ? deleteTarget?.id ?? null : null;

  const handleOpenCreate = useCallback(() => setDialogState({ mode: "create" }), []);
  const handleOpenEdit = useCallback((product: Product) => setDialogState({ mode: "edit", product }), []);
  const handleOpenDelete = useCallback((product: Product) => setDeleteTarget(product), []);

  const handleCloseDialog = useCallback(() => setDialogState(null), []);
  const handleCloseDeleteDialog = useCallback(() => setDeleteTarget(null), []);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) handleCloseDialog();
    },
    [handleCloseDialog],
  );

  const handleDeleteDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) handleCloseDeleteDialog();
    },
    [handleCloseDeleteDialog],
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
          toast.success("Produit créé.");
        }

        handleCloseDialog();
      } catch (error) {
        const apiError = error as ApiError;
        toast.error(getApiErrorMessage(apiError, "Impossible d’enregistrer le produit. Réessaie."));
      }
    },
    [createProductMutation, dialogState?.mode, editTarget, handleCloseDialog, updateProductMutation],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      await deleteProductMutation.mutateAsync({ id: deleteTarget.id });
      toast.success("Produit supprimé.");
      handleCloseDeleteDialog();
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(getApiErrorMessage(apiError, "Impossible de supprimer le produit. Réessaie."));
    }
  }, [deleteProductMutation, deleteTarget, handleCloseDeleteDialog]);

  const handleResetFilters = useCallback(() => {
    setCategoryIdFilter("");
    setStatusFilter("all");
    setPage(1);
  }, []);

  const handleCategoryFilterChange = useCallback((value: string) => {
    setCategoryIdFilter(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: "all" | "active" | "inactive") => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  }, []);

  if (productsQuery.isLoading || categoriesQuery.isLoading) {
    return <ProductsPageSkeleton />;
  }

  if (productsQuery.isError || categoriesQuery.isError) {
    const apiError = (productsQuery.error ?? categoriesQuery.error) as unknown as ApiError;

    return (
      <section className={cn("space-y-6", !embedded && "mx-auto w-full max-w-5xl")}>
        <ProductsHeader canCreate={false} canManage={canManage} embedded={embedded} onCreate={handleOpenCreate} />
        <SectionCard title="Impossible de charger les produits" description={getApiErrorMessage(apiError, "Une erreur inattendue est survenue.")}>
          <Button onClick={() => void Promise.all([productsQuery.refetch(), categoriesQuery.refetch()])}>Réessayer</Button>
        </SectionCard>
      </section>
    );
  }

  return (
    <section className={cn("space-y-6", !embedded && "mx-auto w-full max-w-5xl")}>
      <ProductsHeader canCreate={hasCategories} canManage={canManage} embedded={embedded} onCreate={handleOpenCreate} />

      <SectionCard
        title="Catalogue produits"
        description="Filtrez les produits par nom, catégorie et statut."
        contentClassName="space-y-4"
      >
        <div className="space-y-4">
          <div>
            {lowStockOnly ? <p className="mt-1 text-xs text-amber-700">Affichage centré sur les produits à surveiller.</p> : null}
            {!canManage ? <ReadonlyNotice /> : null}
          </div>

          <ProductsFilters
            categories={categories}
            selectedCategoryId={categoryIdFilter}
            statusFilter={statusFilter}
            disabled={productsQuery.isFetching}
            onCategoryChange={handleCategoryFilterChange}
            onStatusChange={handleStatusChange}
            onReset={handleResetFilters}
          />
        </div>
          {!hasCategories ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <p className="text-sm font-medium text-foreground">Créez d’abord une catégorie pour ajouter des produits.</p>
              <p className="mt-1 text-sm text-muted-foreground">Chaque produit doit être rattaché à une catégorie.</p>
              {canManage ? (
                <Button asChild className="mt-4" variant="outline">
                  <Link to="/app/categories">Ouvrir les catégories</Link>
                </Button>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">Seul le propriétaire peut gérer les catégories.</p>
              )}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center">
              <p className="text-sm font-medium text-foreground">Aucun produit pour le moment.</p>
              <p className="mt-1 text-sm text-muted-foreground">Ajoute le premier produit pour alimenter le catalogue.</p>
              {canManage ? (
                <Button className="mt-4" onClick={handleOpenCreate}>
                  Créer le premier produit
                </Button>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">Seul le propriétaire peut ajouter un produit.</p>
              )}
            </div>
          ) : (
            <ProductsTable
              canManage={canManage}
              items={filteredProducts}
              pendingId={pendingDeleteId}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          )}

          {hasCategories && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              disabled={productsQuery.isFetching}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
      </SectionCard>

      {canManage ? (
        <>
          <ProductDialog
            open={dialogState !== null}
            mode={dialogState?.mode === "edit" ? "edit" : "create"}
            categories={categories}
            defaultProduct={editTarget}
            onOpenChange={handleDialogOpenChange}
            onSubmit={handleCreateOrUpdate}
          />

          <DeleteProductDialog
            open={deleteTarget !== null}
            productName={deleteTarget?.name}
            pending={deleteProductMutation.isPending}
            onOpenChange={handleDeleteDialogOpenChange}
            onConfirm={handleConfirmDelete}
          />
        </>
      ) : null}
    </section>
  );
}
