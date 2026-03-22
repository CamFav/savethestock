import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteLot, useCreateLot, useLotsByReception } from "@/features/lots/api/lots.queries";
import { LotsSkeleton } from "@/features/lots/components/LotsSkeleton";
import { LotsTable } from "@/features/lots/components/LotsTable";
import type { LotListItem } from "@/features/lots/lots.types";
import { useOrderDetail } from "@/features/orders/api/orders.queries";
import { useProductsAll } from "@/features/products/api/products.queries";
import { useReceptionDetail } from "@/features/receptions/api/receptions.queries";
import { ReceptionMetaCard } from "@/features/receptions/components/reception-meta-card";
import { getOrderStatusLabel } from "@/features/orders/orders.utils";
import { useSuppliersAll } from "@/features/suppliers/api/suppliers.queries";
import type { ApiError } from "@/shared/api/apiClient";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";
import { Pagination } from "@/shared/ui/pagination";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionCard } from "@/shared/ui/section-card";
import { DetailBackLink } from "@/shared/ui/detail-back-link";

const LotDialog = lazy(() => import("@/features/lots/components/LotDialog").then((module) => ({ default: module.LotDialog })));
const DeleteLotDialog = lazy(() =>
  import("@/features/lots/components/DeleteLotDialog").then((module) => ({ default: module.DeleteLotDialog })),
);

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 404) return "Réception introuvable.";
  if (error.status === 400) return error.message ?? "Requête invalide.";
  if (error.status === 409) return "Cette opération entre en conflit avec les données existantes.";
  if (error.status === 401) return "Votre session a expiré.";
  return error.message ?? fallback;
}

export function ReceptionDetailPage() {
  const params = useParams<{ id: string }>();
  const receptionId = params.id ?? "";

  const [lotsPage, setLotsPage] = useState(1);
  const [lotsPageSize, setLotsPageSize] = useState(10);
  const [isLotDialogOpen, setIsLotDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LotListItem | null>(null);
  const [highlightedLotId, setHighlightedLotId] = useState<string | null>(null);
  const lotsSectionRef = useRef<HTMLDivElement | null>(null);

  const lotsParams = useMemo(
    () => ({ receptionId, page: lotsPage, pageSize: lotsPageSize }),
    [receptionId, lotsPage, lotsPageSize],
  );

  const detailQuery = useReceptionDetail(receptionId);
  const lotsQuery = useLotsByReception(lotsParams);
  const suppliersQuery = useSuppliersAll();
  const productsQuery = useProductsAll();
  const createLotMutation = useCreateLot();
  const deleteLotMutation = useDeleteLot();

  const suppliers = useMemo(() => suppliersQuery.data?.items ?? [], [suppliersQuery.data?.items]);
  const products = useMemo(() => productsQuery.data?.items ?? [], [productsQuery.data?.items]);

  const supplierNameById = useMemo(() => {
    return suppliers.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});
  }, [suppliers]);

  const productNameById = useMemo(() => {
    return products.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});
  }, [products]);

  const mappedLots = useMemo(() => {
    const items = lotsQuery.data?.items ?? [];
    return items.map((lot) => ({
      ...lot,
      productName: productNameById[lot.productId] ?? "Produit inconnu",
    }));
  }, [lotsQuery.data?.items, productNameById]);

  const detail = detailQuery.data;
  const linkedOrderQuery = useOrderDetail(detail?.orderId ?? "");
  const linkedOrder = linkedOrderQuery.data ?? null;
  const totalLots = lotsQuery.data?.total ?? 0;
  const canAddLot = products.length > 0 && !productsQuery.isLoading;
  const pendingDeleteId = deleteLotMutation.isPending ? deleteTarget?.id ?? null : null;

  const handleAddLot = useCallback(
    async (values: { productId: string; quantityInitial: number; receptionId?: string }) => {
      if (!receptionId) return;

      try {
        const created = await createLotMutation.mutateAsync({
          receptionId,
          productId: values.productId,
          quantityInitial: values.quantityInitial,
        });
        toast.success("Lot ajouté à la réception.");
        setIsLotDialogOpen(false);
        setLotsPage(1);
        setHighlightedLotId(created.id);
      } catch (error) {
        const apiError = error as unknown as ApiError;
        toast.error(getApiErrorMessage(apiError, "Impossible d’ajouter le lot. Réessayez."));
      }
    },
    [createLotMutation, receptionId],
  );

  const handleDeleteLot = useCallback(async () => {
    if (!deleteTarget || !receptionId) return;

    try {
      await deleteLotMutation.mutateAsync({ id: deleteTarget.id, receptionId });
      toast.success("Lot supprimé.");
      setDeleteTarget(null);
    } catch (error) {
      const apiError = error as unknown as ApiError;
      toast.error(getApiErrorMessage(apiError, "Impossible de supprimer le lot. Réessayez."));
    }
  }, [deleteLotMutation, deleteTarget, receptionId]);

  const handlePageSizeChange = useCallback((next: number) => {
    setLotsPageSize(next);
    setLotsPage(1);
  }, []);

  useEffect(() => {
    if (!highlightedLotId || lotsQuery.isFetching || lotsQuery.isLoading) return;

    const row = document.getElementById(`lot-row-${highlightedLotId}`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      const timeoutId = window.setTimeout(() => setHighlightedLotId(null), 2800);
      return () => window.clearTimeout(timeoutId);
    }

    lotsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [highlightedLotId, lotsQuery.isFetching, lotsQuery.isLoading]);

  if (!receptionId) {
    return (
      <section className="mx-auto w-full max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Réception introuvable</CardTitle>
          </CardHeader>
        </Card>
      </section>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
        <LotsSkeleton />
      </section>
    );
  }

  if (detailQuery.isError || !detail) {
    const apiError = detailQuery.error as unknown as ApiError;

    return (
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Réception</h1>
          <p className="text-sm text-muted-foreground">Consultez les informations de réception et les lots associés.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Impossible de charger la réception</CardTitle>
            <CardDescription>{getApiErrorMessage(apiError, "Une erreur inattendue est survenue.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => detailQuery.refetch()}>Réessayer</Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const supplierName = detail.supplierId ? supplierNameById[detail.supplierId] ?? "Fournisseur inconnu" : "Fournisseur inconnu";

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Reception"
        description="Retrouvez les informations de réception et les lots reliés à cette entrée de stock."
        actions={
          <>
            <DetailBackLink to="/app/receptions" label="Retour aux réceptions" />
            <Button disabled={!canAddLot} onClick={() => setIsLotDialogOpen(true)}>
              {createLotMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Ajouter un lot
            </Button>
          </>
        }
      />

      <ReceptionMetaCard reception={detail} supplierName={supplierName} />

      <SectionCard title="Lien avec la commande" description="La commande prépare l'achat. Cette réception enregistre ce qui a vraiment été livré.">
        {linkedOrder ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-border/70 bg-muted/30 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{linkedOrder.reference}</p>
              <p className="text-sm text-muted-foreground">
                Commande d'origine {getOrderStatusLabel(linkedOrder.status).toLowerCase()} · {linkedOrder.lines.length} produit(s) prévus
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to={`/app/orders/${linkedOrder.id}`}>Ouvrir la commande</Link>
            </Button>
          </div>
        ) : (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Aucune commande d'origine n'est reliée à cette réception.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Lots de la réception"
        description={`${totalLots} lot${totalLots > 1 ? "s" : ""} lié${totalLots > 1 ? "s" : ""} à cette réception`}
        className="border-border/70"
      >
        <div ref={lotsSectionRef} className="space-y-4">
          {lotsQuery.isLoading ? (
            <LotsSkeleton />
          ) : lotsQuery.isError ? (
            <Card>
              <CardHeader>
                <CardTitle>Impossible de charger les lots</CardTitle>
                <CardDescription>
                  {getApiErrorMessage(lotsQuery.error as unknown as ApiError, "Une erreur inattendue est survenue.")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => lotsQuery.refetch()}>Réessayer</Button>
              </CardContent>
            </Card>
          ) : mappedLots.length === 0 ? (
            <EmptyStateCard
              title="Aucun lot sur cette réception"
              description="Ajoutez les lots reçus pour suivre ce qui est entré en stock."
              ctaLabel="Ajouter un lot"
              onCtaClick={() => setIsLotDialogOpen(true)}
            />
          ) : (
            <LotsTable items={mappedLots} pendingDeleteId={pendingDeleteId} onDelete={setDeleteTarget} highlightedId={highlightedLotId} />
          )}

          <Pagination
            page={lotsPage}
            pageSize={lotsPageSize}
            total={totalLots}
            disabled={lotsQuery.isFetching}
            pageSizeId="reception-lots-page-size"
            onPageChange={setLotsPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </SectionCard>

      <Suspense fallback={null}>
        <LotDialog
          open={isLotDialogOpen}
          mode="create"
          products={products}
          receptions={[]}
          fixedReceptionId={receptionId}
          pending={createLotMutation.isPending}
          onOpenChange={setIsLotDialogOpen}
          onSubmit={handleAddLot}
        />

        <DeleteLotDialog
          open={deleteTarget !== null}
          productName={deleteTarget?.productName}
          pending={deleteLotMutation.isPending}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onConfirm={handleDeleteLot}
        />
      </Suspense>
    </section>
  );
}
