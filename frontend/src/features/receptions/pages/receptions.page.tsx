import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useReceptionsList, useCreateReception } from "@/features/receptions/api/receptions.queries";
import { ReceptionsHeader } from "@/features/receptions/components/ReceptionsHeader";
import { ReceptionsPageSkeleton } from "@/features/receptions/components/ReceptionsPageSkeleton";
import { ReceptionsTable } from "@/features/receptions/components/ReceptionsTable";
import type { ReceptionListItem } from "@/features/receptions/receptions.types";
import { useSuppliersAll } from "@/features/suppliers/api/suppliers.queries";
import { useOrdersStore } from "@/features/orders/orders.store";
import { Pagination } from "@/shared/ui/pagination";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";
import type { ApiError } from "@/shared/api/apiClient";

const ReceptionDialog = lazy(() =>
  import("@/features/receptions/components/ReceptionDialog").then((module) => ({ default: module.ReceptionDialog })),
);

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 404) return "Réception introuvable.";
  if (error.status === 409) return "Cette réception entre en conflit avec les données existantes.";
  if (error.status === 400) return error.message ?? "Requête invalide.";
  if (error.status === 401) return "Votre session a expiré.";
  return error.message ?? fallback;
}

function withSupplierNames(items: ReceptionListItem[], supplierMap: Record<string, string>) {
  return items.map((item) => ({
    ...item,
    supplierName: item.supplierId ? supplierMap[item.supplierId] ?? "Fournisseur inconnu" : "Fournisseur inconnu",
  }));
}

export function ReceptionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const listParams = useMemo(() => ({ page, pageSize }), [page, pageSize]);
  const receptionsQuery = useReceptionsList(listParams);
  const suppliersQuery = useSuppliersAll();
  const createReceptionMutation = useCreateReception();
  const attachReceptionToOrder = useOrdersStore((state) => state.attachReceptionToOrder);
  const isDialogOpen = searchParams.get("create") === "1";
  const orderId = searchParams.get("orderId") ?? "";
  const defaultSupplierId = searchParams.get("supplierId") ?? "";
  const defaultReference = searchParams.get("reference") ?? "";
  const defaultNotes = searchParams.get("notes") ?? "";
  const defaultReceptionDate = searchParams.get("receptionDate") ?? "";

  const suppliers = useMemo(() => suppliersQuery.data?.items ?? [], [suppliersQuery.data?.items]);
  const canCreate = suppliers.length > 0 && !suppliersQuery.isLoading && !suppliersQuery.isError;

  const supplierNameById = useMemo(() => {
    return suppliers.reduce<Record<string, string>>((acc, supplier) => {
      acc[supplier.id] = supplier.name;
      return acc;
    }, {});
  }, [suppliers]);

  const items = useMemo(() => receptionsQuery.data?.items ?? [], [receptionsQuery.data?.items]);
  const total = receptionsQuery.data?.total ?? 0;
  const rows = useMemo(() => withSupplierNames(items, supplierNameById), [items, supplierNameById]);

  const setCreateOpen = useCallback(
    (open: boolean) => {
      const next = new URLSearchParams(searchParams);
      if (open) next.set("create", "1");
      else next.delete("create");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleCreateSubmit = useCallback(
    async (values: { supplierId: string; receptionDate: string; reference: string; notes: string }) => {
      try {
        const created = await createReceptionMutation.mutateAsync({
          supplierId: values.supplierId,
          receptionDate: values.receptionDate,
          reference: values.reference.trim() || undefined,
          notes: values.notes.trim() || undefined,
        });
        if (orderId) {
          attachReceptionToOrder(orderId, created.id);
        }
        toast.success("Réception créée. Ajoutez maintenant les lots reçus.");
        navigate(`/app/receptions/${created.id}`, { replace: true });
      } catch (error) {
        const apiError = error as unknown as ApiError;
        toast.error(getApiErrorMessage(apiError, "Impossible de créer la réception. Réessayez."));
      }
    },
    [attachReceptionToOrder, createReceptionMutation, navigate, orderId],
  );

  const handlePageSizeChange = useCallback((nextPageSize: number) => {
    setPageSize(nextPageSize);
    setPage(1);
  }, []);

  if (receptionsQuery.isLoading) {
    return <ReceptionsPageSkeleton />;
  }

  if (receptionsQuery.isError) {
    const apiError = receptionsQuery.error as unknown as ApiError;

    return (
      <section className="page-shell">
        <ReceptionsHeader canCreate={canCreate} onCreate={() => setCreateOpen(true)} />
        <Card>
          <CardHeader>
            <CardTitle>Impossible de charger les réceptions</CardTitle>
            <CardDescription>{getApiErrorMessage(apiError, "Une erreur inattendue est survenue.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => receptionsQuery.refetch()}>Réessayer</Button>
          </CardContent>
        </Card>

        <Suspense fallback={null}>
          <ReceptionDialog
            open={isDialogOpen}
            suppliers={suppliers}
            pending={createReceptionMutation.isPending}
            defaultValues={{
              supplierId: defaultSupplierId,
              reference: defaultReference,
              notes: defaultNotes,
              receptionDate: defaultReceptionDate,
            }}
            onOpenChange={setCreateOpen}
            onSubmit={handleCreateSubmit}
          />
        </Suspense>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <ReceptionsHeader canCreate={canCreate} onCreate={() => setCreateOpen(true)} />

      <Card className="panel-muted">
        <CardHeader>
          <CardTitle className="text-base">Liste des réceptions</CardTitle>
          <CardDescription>{total} réception{total > 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <EmptyStateCard
              title="Aucune réception pour le moment"
              description="Les réceptions enregistrent les entrées de stock de vos fournisseurs."
              ctaLabel="Nouvelle réception"
              onCtaClick={() => setCreateOpen(true)}
              ctaDisabled={!canCreate}
              hint={!canCreate ? "Ajoutez d’abord un fournisseur dans le catalogue pour créer une réception." : undefined}
            />
          ) : (
            <ReceptionsTable items={rows} />
          )}

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            disabled={receptionsQuery.isFetching}
            pageSizeId="receptions-page-size"
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <ReceptionDialog
          open={isDialogOpen}
          suppliers={suppliers}
          pending={createReceptionMutation.isPending}
          defaultValues={{
            supplierId: defaultSupplierId,
            reference: defaultReference,
            notes: defaultNotes,
            receptionDate: defaultReceptionDate,
          }}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreateSubmit}
        />
      </Suspense>
    </section>
  );
}
