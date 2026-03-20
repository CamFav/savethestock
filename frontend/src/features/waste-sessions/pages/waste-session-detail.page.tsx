import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCategoriesList } from "@/features/categories/api/categories.queries";
import { useLotsList } from "@/features/lots/api/lots.queries";
import { useProductsAll } from "@/features/products/api/products.queries";
import {
  useAddWasteLine,
  useDeleteWasteLine,
  usePostWasteSession,
  useUpdateWasteLine,
  useWasteSessionDetail,
} from "@/features/waste-sessions/api/wasteSessions.queries";
import type { WasteLine } from "@/features/waste-sessions/api/wasteSessions.types";
import { buildWasteLotOptions } from "@/features/waste-sessions/waste-lot-options";
import { WasteStatusBadge } from "@/features/waste-sessions/components/waste-status-badge";
import type { ApiError } from "@/shared/api/apiClient";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionCard } from "@/shared/ui/section-card";
import { DetailBackLink } from "@/shared/ui/detail-back-link";

const WasteLineDialog = lazy(() =>
  import("@/features/waste-sessions/components/waste-line-dialog").then((module) => ({ default: module.WasteLineDialog })),
);
const PostWasteSessionDialog = lazy(() =>
  import("@/features/waste-sessions/components/post-waste-session-dialog").then((module) => ({ default: module.PostWasteSessionDialog })),
);
const DeleteWasteLineDialog = lazy(() =>
  import("@/features/waste-sessions/components/delete-waste-line-dialog").then((module) => ({ default: module.DeleteWasteLineDialog })),
);

type LineDialogState =
  | { mode: "create" }
  | { mode: "edit"; line: WasteLine }
  | null;

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 404) return "Perte introuvable.";
  if (error.status === 409) return "Conflit sur cette opération.";
  if (error.status === 400) {
    const message = error.message?.toLowerCase() ?? "";
    if (message.includes("insufficient_quantity")) {
      return "Un lot ne dispose pas d’une quantité restante suffisante pour cette perte.";
    }
    if (message.includes("already_posted")) {
      return "Cette perte est déjà validée.";
    }

    return error.message ?? "Requête invalide.";
  }
  if (error.status === 401) return "Votre session a expiré.";
  return error.message ?? fallback;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function shouldShowPostedBy(status: string): boolean {
  return status.toUpperCase() === "POSTED";
}

export function WasteSessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id ?? "";

  const [lineDialogState, setLineDialogState] = useState<LineDialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<WasteLine | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);

  const detailQuery = useWasteSessionDetail(sessionId);
  const lotsQuery = useLotsList({ page: 1, pageSize: 1000 });
  const productsQuery = useProductsAll();
  const categoriesQuery = useCategoriesList({ page: 1, pageSize: 200 });

  const addLineMutation = useAddWasteLine();
  const updateLineMutation = useUpdateWasteLine();
  const deleteLineMutation = useDeleteWasteLine();
  const postSessionMutation = usePostWasteSession();

  const session = detailQuery.data;
  const canEdit = session?.status?.toUpperCase() === "DRAFT";

  const productById = useMemo(() => {
    const products = productsQuery.data?.items ?? [];
    return new Map(products.map((product) => [product.id, product]));
  }, [productsQuery.data?.items]);

  const displayLotOptions = useMemo(() => {
    return buildWasteLotOptions({
      lots: lotsQuery.data?.items ?? [],
      products: productsQuery.data?.items ?? [],
      categories: categoriesQuery.data?.items ?? [],
      includeEmpty: true,
    });
  }, [categoriesQuery.data?.items, lotsQuery.data?.items, productsQuery.data?.items]);

  const lotLabelById = useMemo(() => {
    return displayLotOptions.reduce<Record<string, string>>((acc, option) => {
      acc[option.id] = option.label;
      return acc;
    }, {});
  }, [displayLotOptions]);

  const lotOptions = useMemo(() => {
    return buildWasteLotOptions({
      lots: lotsQuery.data?.items ?? [],
      products: productsQuery.data?.items ?? [],
      categories: categoriesQuery.data?.items ?? [],
    });
  }, [categoriesQuery.data?.items, lotsQuery.data?.items, productsQuery.data?.items]);

  const totalQuantity = useMemo(() => session?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0, [session?.lines]);
  const uniqueProductCount = useMemo(() => {
    if (!session) return 0;

    const lotsById = new Map((lotsQuery.data?.items ?? []).map((lot) => [lot.id, lot]));
    const productIds = new Set<string>();
    for (const line of session.lines) {
      const productId = lotsById.get(line.lotId)?.productId;
      if (productId) {
        productIds.add(productId);
      }
    }

    return productIds.size;
  }, [lotsQuery.data?.items, session]);
  const uniqueLotCount = session?.lines.length ?? 0;
  const estimatedWasteValue = useMemo(() => {
    if (!session) return 0;

    const lotsById = new Map((lotsQuery.data?.items ?? []).map((lot) => [lot.id, lot]));
    return session.lines.reduce((sum, line) => {
      const unitCost = lotsById.get(line.lotId)?.unitCost;
      return sum + (typeof unitCost === "number" ? unitCost * line.quantity : 0);
    }, 0);
  }, [lotsQuery.data?.items, session]);
  const reasonsSummary = useMemo(() => {
    if (!session) return [];
    const counts = new Map<string, number>();
    for (const line of session.lines) {
      counts.set(line.reason, (counts.get(line.reason) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .slice(0, 3)
      .map(([reason, count]) => `${reason} (${count})`);
  }, [session]);

  const handleAddOrEditLine = useCallback(
    async (values: { lotId: string; quantity: number; reason: string }) => {
      if (!session) return;

      try {
        if (lineDialogState?.mode === "edit") {
          await updateLineMutation.mutateAsync({
            sessionId: session.id,
            lineId: lineDialogState.line.id,
            quantity: values.quantity,
            reason: values.reason,
          });
          toast.success("Lot de perte mis à jour.");
        } else {
          await addLineMutation.mutateAsync({
            sessionId: session.id,
            payload: {
              lotId: values.lotId,
              quantity: values.quantity,
              reason: values.reason,
            },
          });
          toast.success("Lot de perte ajouté.");
        }

        setLineDialogState(null);
      } catch (error) {
        const apiError = error as unknown as ApiError;
        toast.error(getApiErrorMessage(apiError, "Impossible d’enregistrer ce lot. Réessayez."));
      }
    },
    [addLineMutation, lineDialogState, session, updateLineMutation],
  );

  const handleDeleteLine = useCallback(async () => {
    if (!session || !deleteTarget) return;

    try {
      await deleteLineMutation.mutateAsync({
        sessionId: session.id,
        lineId: deleteTarget.id,
      });
      toast.success("Lot de perte supprimé.");
      setDeleteTarget(null);
    } catch (error) {
      const apiError = error as unknown as ApiError;
      toast.error(getApiErrorMessage(apiError, "Impossible de supprimer ce lot. Réessayez."));
    }
  }, [deleteLineMutation, deleteTarget, session]);

  const handlePostSession = useCallback(async () => {
    if (!session) return;

    try {
      await postSessionMutation.mutateAsync(session.id);
      toast.success("Perte validée.");
      setIsPostDialogOpen(false);
    } catch (error) {
      const apiError = error as unknown as ApiError;
      toast.error(getApiErrorMessage(apiError, "Impossible de valider cette perte."));
    }
  }, [postSessionMutation, session]);

  if (!sessionId) {
    return (
      <section className="mx-auto w-full max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Perte introuvable</CardTitle>
          </CardHeader>
        </Card>
      </section>
    );
  }

  if (detailQuery.isLoading || lotsQuery.isLoading || productsQuery.isLoading || categoriesQuery.isLoading) {
    return (
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-52 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <Card>
          <CardHeader>
            <div className="h-5 w-52 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (detailQuery.isError || lotsQuery.isError || productsQuery.isError || categoriesQuery.isError || !session) {
    const apiError = (detailQuery.error ?? lotsQuery.error ?? productsQuery.error ?? categoriesQuery.error) as unknown as ApiError;

    return (
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Perte</h1>
          <p className="text-sm text-muted-foreground">Consultez les lots concernés et validez la session une fois complète.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Impossible de charger la perte</CardTitle>
            <CardDescription>{getApiErrorMessage(apiError, "Une erreur inattendue est survenue.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void Promise.all([detailQuery.refetch(), lotsQuery.refetch(), productsQuery.refetch(), categoriesQuery.refetch()])}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const isDeletePending = deleteLineMutation.isPending && deleteTarget !== null;

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span>Perte</span>
            <WasteStatusBadge status={session.status} />
          </span>
        }
        description="Retrouvez les lots concernés et validez cette declaration quand elle est complete."
        actions={
          <>
            <DetailBackLink to="/app/waste-sessions" label="Retour aux pertes" />
            {canEdit ? (
              <Button onClick={() => setIsPostDialogOpen(true)} disabled={session.lines.length === 0 || postSessionMutation.isPending}>
                {postSessionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {postSessionMutation.isPending ? "Validation..." : "Valider la perte"}
              </Button>
            ) : null}
          </>
        }
      />

      <SectionCard title="Détails de la perte" description="Une déclaration en brouillon reste modifiable jusqu'à sa validation.">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="font-medium">{formatDate(session.wasteDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Statut</p>
            <WasteStatusBadge status={session.status} />
          </div>
          <div>
            <p className="text-muted-foreground">Créé le</p>
            <p className="font-medium">{formatDate(session.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Lots concernés</p>
            <p className="font-medium">{session.lines.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Quantité totale</p>
            <p className="font-medium">{totalQuantity}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Produits concernés</p>
            <p className="font-medium">{uniqueProductCount}</p>
          </div>
          {shouldShowPostedBy(session.status) ? (
            <div>
              <p className="text-muted-foreground">Valide par</p>
              <p className="font-medium">{session.postedByName ?? "—"}</p>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Commentaire</p>
            <p className="font-medium">{session.comment ?? "—"}</p>
          </div>
        </div>
        {!canEdit ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Cette session a été validée et a déjà décrémenté le stock des lots concernés.
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Lots concernés"
        description="Ajoutez les lots concernes et indiquez la raison de chaque perte."
        className="border-border/70"
        actions={canEdit ? (
            <Button onClick={() => setLineDialogState({ mode: "create" })}>
              <Plus className="h-4 w-4" />
              Ajouter un lot
            </Button>
          ) : null}
      >
          {session.lines.length === 0 ? (
            canEdit ? (
              <EmptyStateCard
                title="Aucun lot pour le moment"
                description="Ajoutez au moins un lot avant de valider cette perte."
                ctaLabel="Ajouter un lot"
                onCtaClick={() => setLineDialogState({ mode: "create" })}
              />
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center">
                <p className="text-sm font-medium text-foreground">Aucun lot enregistré</p>
                <p className="mt-1 text-sm text-muted-foreground">Cette perte validée est désormais en lecture seule.</p>
              </div>
            )
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead className="w-[80px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {session.lines.map((line) => {
                    const selectedLot = displayLotOptions.find((option) => option.id === line.lotId) ?? null;
                    const product = selectedLot ? productById.get(selectedLot.productId) : null;
                    const estimatedLineValue =
                      selectedLot && typeof selectedLot.unitCost === "number" ? selectedLot.unitCost * line.quantity : null;

                    return (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium">{selectedLot?.productName ?? "Produit non chargé"}</p>
                            {selectedLot?.categoryName ? (
                              <p className="text-xs text-muted-foreground">{selectedLot.categoryName}</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="space-y-0.5">
                            <p>{lotLabelById[line.lotId] ?? "Lot non chargé"}</p>
                            <p className="text-xs text-muted-foreground">
                              Restant actuel : {selectedLot?.remainingQuantity ?? "—"}
                              {product?.unit ? ` ${product.unit}` : ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {line.quantity}
                          {product?.unit ? ` ${product.unit}` : ""}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p>{line.reason}</p>
                            {estimatedLineValue !== null ? (
                              <p className="text-xs text-muted-foreground">Valeur estimée : {formatCurrency(estimatedLineValue)}</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {canEdit ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" disabled={isDeletePending}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setLineDialogState({ mode: "edit", line })}>
                                  <Pencil className="h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onSelect={() => setDeleteTarget(line)}>
                                  <Trash2 className="h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs text-muted-foreground">Verrouillé</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
      </SectionCard>

      <Suspense fallback={null}>
        <WasteLineDialog
          open={lineDialogState !== null}
          mode={lineDialogState?.mode ?? "create"}
          lotOptions={lotOptions}
          defaultLine={lineDialogState?.mode === "edit" ? lineDialogState.line : null}
          pending={addLineMutation.isPending || updateLineMutation.isPending}
          onOpenChange={(open) => {
            if (!open) setLineDialogState(null);
          }}
          onSubmit={handleAddOrEditLine}
        />

        <PostWasteSessionDialog
          open={isPostDialogOpen}
          pending={postSessionMutation.isPending}
          linesCount={session.lines.length}
          totalQuantity={totalQuantity}
          reasonsSummary={reasonsSummary}
          productsCount={uniqueProductCount}
          lotsCount={uniqueLotCount}
          estimatedValue={estimatedWasteValue}
          onOpenChange={setIsPostDialogOpen}
          onConfirm={handlePostSession}
        />

        <DeleteWasteLineDialog
          open={deleteTarget !== null}
          pending={deleteLineMutation.isPending}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onConfirm={handleDeleteLine}
        />
      </Suspense>
    </section>
  );
}
