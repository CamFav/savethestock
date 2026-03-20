import { useCallback, useMemo, useState } from "react";
import { FolderTree, Plus } from "lucide-react";
import { toast } from "sonner";
import { isOwnerRole } from "@/shared/auth/roles";
import { useSessionStore } from "@/shared/auth/sessionStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategoriesList,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/features/categories/api/categories.queries";
import type { Category } from "@/features/categories/api/categories.types";
import { CategoriesPagination } from "@/features/categories/components/categories-pagination";
import { CategoriesTable } from "@/features/categories/components/categories-table";
import { CategoryDialog } from "@/features/categories/components/category-dialog";
import { DeleteCategoryDialog } from "@/features/categories/components/delete-category-dialog";
import type { ApiError } from "@/shared/api/apiClient";
import { PageHeader } from "@/shared/ui/page-header";
import { ReadonlyNotice } from "@/shared/ui/readonly-notice";
import { SectionCard } from "@/shared/ui/section-card";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; category: Category }
  | null;

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 409) {
    const message = error.message?.toLowerCase() ?? "";
    if (message.includes("duplicate_name") || message.includes("already exists") || message.includes("already used")) {
      return "Une catégorie portant ce nom existe déjà.";
    }
  }

  if (error.status === 404) return "Categorie introuvable.";
  if (error.status === 400) return error.message ?? "Requete invalide.";
  if (error.status === 401) return "Votre session a expiré.";
  return error.message ?? fallback;
}

function CategoriesPageSkeleton() {
  return (
    <section className="page-shell space-y-6">
      <div className="page-hero space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </section>
  );
}

export function CategoriesPage() {
  const role = useSessionStore((s) => s.role);
  const canManage = isOwnerRole(role);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const listParams = useMemo(() => ({ page, pageSize }), [page, pageSize]);

  const categoriesQuery = useCategoriesList(listParams);
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const total = categoriesQuery.data?.total ?? 0;
  const items = categoriesQuery.data?.items ?? [];
  const pendingDeleteId = deleteCategoryMutation.isPending ? deleteTarget?.id ?? null : null;
  const editTarget = dialogState?.mode === "edit" ? dialogState.category : null;

  const closeDialog = useCallback(() => setDialogState(null), []);
  const closeDeleteDialog = useCallback(() => setDeleteTarget(null), []);
  const openCreateDialog = useCallback(() => setDialogState({ mode: "create" }), []);
  const openEditDialog = useCallback((category: Category) => setDialogState({ mode: "edit", category }), []);
  const openDeleteDialog = useCallback((category: Category) => setDeleteTarget(category), []);

  const handleCreateSubmit = useCallback(
    async (name: string) => {
      try {
        await createCategoryMutation.mutateAsync({ name });
        toast.success("Categorie creee.");
        closeDialog();
      } catch (error) {
        toast.error(getApiErrorMessage(error as ApiError, "Impossible de créer la catégorie."));
      }
    },
    [closeDialog, createCategoryMutation],
  );

  const handleEditSubmit = useCallback(
    async (name: string) => {
      if (!editTarget) {
        return;
      }

      try {
        await updateCategoryMutation.mutateAsync({ id: editTarget.id, name });
        toast.success("Categorie mise a jour.");
        closeDialog();
      } catch (error) {
        toast.error(getApiErrorMessage(error as ApiError, "Impossible de mettre à jour la catégorie."));
      }
    },
    [closeDialog, editTarget, updateCategoryMutation],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteCategoryMutation.mutateAsync({ id: deleteTarget.id });
      toast.success("Categorie supprimee.");
      closeDeleteDialog();
    } catch (error) {
      toast.error(getApiErrorMessage(error as ApiError, "Impossible de supprimer la catégorie."));
    }
  }, [closeDeleteDialog, deleteCategoryMutation, deleteTarget]);

  const handlePageSizeChange = useCallback((nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  }, []);

  if (categoriesQuery.isLoading) {
    return <CategoriesPageSkeleton />;
  }

  if (categoriesQuery.isError) {
    const error = categoriesQuery.error as unknown as ApiError;

    return (
      <section className="page-shell space-y-6">
        <PageHeader title="Categories" description="Structure de classement commune a tout le catalogue." />

        <SectionCard title="Impossible de charger les categories" description={getApiErrorMessage(error, "Une erreur inattendue est survenue.")}>
          <Button onClick={() => categoriesQuery.refetch()}>Réessayer</Button>
        </SectionCard>
      </section>
    );
  }

  return (
    <section className="page-shell space-y-6">
      <section className="page-hero relative overflow-hidden border-border/70 bg-[linear-gradient(135deg,#f6f4ee_0%,#fffdf8_55%,#ece7da_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(67,56,26,0.06),transparent_30%)]" />
        <div className="relative space-y-4">
          <p className="page-eyebrow">Organisation du catalogue</p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <h1 className="page-title">Categories</h1>
              <p className="page-description">
                Des catégories simples rendent la recherche plus rapide dans le catalogue et aident l'équipe à retrouver les produits en un coup d'œil.
              </p>
            </div>
            <div className="rounded-[22px] border border-border/70 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Categories actives</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">{total}</p>
            </div>
          </div>
        </div>
      </section>

      <PageHeader
        title={
          <div className="flex flex-wrap items-center gap-2">
            <span>Categories</span>
            {!canManage ? (
              <span className="inline-flex rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                Consultation seule
              </span>
            ) : null}
          </div>
        }
        description="Ajoutez et entretenez des familles claires pour garder le catalogue lisible."
        actions={
          <Button onClick={openCreateDialog} disabled={!canManage}>
            <Plus className="h-4 w-4" />
            Nouvelle catégorie
          </Button>
        }
      />

      <SectionCard title="Liste des catégories" description={`${total} catégorie(s)`}>
        {!canManage ? <ReadonlyNotice /> : null}
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <FolderTree className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Aucune catégorie pour le moment.</p>
            {canManage ? (
              <Button className="mt-4" onClick={openCreateDialog}>
                Créer la première catégorie
              </Button>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">Seul le propriétaire peut ajouter une catégorie.</p>
            )}
          </div>
        ) : (
          <CategoriesTable
            canManage={canManage}
            items={items}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
            pendingId={pendingDeleteId}
          />
        )}

        <CategoriesPagination
          page={page}
          pageSize={pageSize}
          total={total}
          disabled={categoriesQuery.isFetching}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </SectionCard>

      {canManage ? (
        <>
          <CategoryDialog
            open={dialogState?.mode === "create"}
            mode="create"
            onOpenChange={(open) => {
              if (!open) {
                closeDialog();
              }
            }}
            onSubmit={handleCreateSubmit}
          />

          <CategoryDialog
            open={dialogState?.mode === "edit"}
            mode="edit"
            defaultName={editTarget?.name}
            onOpenChange={(open) => {
              if (!open) {
                closeDialog();
              }
            }}
            onSubmit={handleEditSubmit}
          />

          <DeleteCategoryDialog
            open={deleteTarget !== null}
            categoryName={deleteTarget?.name}
            pending={deleteCategoryMutation.isPending}
            onOpenChange={(open) => {
              if (!open) {
                closeDeleteDialog();
              }
            }}
            onConfirm={handleConfirmDelete}
          />
        </>
      ) : null}
    </section>
  );
}
