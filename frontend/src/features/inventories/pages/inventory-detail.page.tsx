import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { useLotsList } from "@/features/lots/api/lots.queries";
import { getLotRemainingQuantity, isLotExpired } from "@/features/lots/lots-stock.utils";
import { useProductsAll } from "@/features/products/api/products.queries";
import {
  useDeleteInventoryLine,
  useInventoryDetail,
  usePostInventory,
  useUpdateInventoryLine,
  useUpsertInventoryLine,
} from "@/features/inventories/api/inventories.queries";
import type { InventoryLine } from "@/features/inventories/api/inventories.types";
import {
  clearInventoryDraftProgress,
  getUntouchedInventoryLineIds,
  markInventoryLinesAsCounted,
  removeInventoryLineFromDraftProgress,
} from "@/features/inventories/inventory-draft-progress";
import { buildAvailableStockByProduct, getDraftInventoryExpectedQuantity } from "@/features/inventories/inventory-stock.utils";
import { useAddWasteLine, useCreateWasteSession } from "@/features/waste-sessions/api/wasteSessions.queries";
import { InventoryStatusBadge } from "@/features/inventories/components/inventory-status-badge";
import type { ApiError } from "@/shared/api/apiClient";
import { useUrlQueryFilters } from "@/shared/routing/use-url-query-filters";
import { EmptyStateCard } from "@/shared/ui/empty-state-card";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionCard } from "@/shared/ui/section-card";
import { DetailBackLink } from "@/shared/ui/detail-back-link";

const InventoryLineDialog = lazy(() =>
  import("@/features/inventories/components/inventory-line-dialog").then((module) => ({ default: module.InventoryLineDialog })),
);
const PostInventoryDialog = lazy(() =>
  import("@/features/inventories/components/post-inventory-dialog").then((module) => ({ default: module.PostInventoryDialog })),
);
const DeleteInventoryLineDialog = lazy(() =>
  import("@/features/inventories/components/delete-inventory-line-dialog").then((module) => ({ default: module.DeleteInventoryLineDialog })),
);

type LineDialogState =
  | { mode: "create" }
  | { mode: "edit"; line: InventoryLine }
  | null;

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 404) return "Inventaire introuvable.";
  if (error.status === 409) return "Conflit sur cette opération.";
  if (error.status === 400) {
    const message = error.message?.toLowerCase() ?? "";
    if (message.includes("inactive_product")) return "Un des produits sélectionnés est inactif.";
    if (message.includes("no_lot_for_product")) return "Un produit ne possède aucun lot actif à rapprocher.";
    if (message.includes("already_posted")) return "Cet inventaire est déjà validé.";

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

function formatDelta(value: number): string {
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : String(value);
}

function shouldShowPostedBy(status: string): boolean {
  return status.toUpperCase() === "POSTED";
}

function getDeltaStyles(delta: number) {
  if (delta < 0) {
    return {
      row: "bg-red-50/60",
      badge: "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (delta > 0) {
    return {
      row: "bg-amber-50/60",
      badge: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    row: "bg-emerald-50/40",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

export function InventoryDetailPage() {
  const params = useParams<{ id: string }>();
  const inventoryId = params.id ?? "";
  const navigate = useNavigate();

  const [lineDialogState, setLineDialogState] = useState<LineDialogState>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryLine | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const { filters, setFilters } = useUrlQueryFilters({ defaultPage: 1, defaultPageSize: 10 });

  const detailQuery = useInventoryDetail(inventoryId);
  const productsQuery = useProductsAll();
  const lotsQuery = useLotsList({ page: 1, pageSize: 1000 });

  const upsertLineMutation = useUpsertInventoryLine();
  const updateLineMutation = useUpdateInventoryLine();
  const deleteLineMutation = useDeleteInventoryLine();
  const postInventoryMutation = usePostInventory();
  const createWasteSessionMutation = useCreateWasteSession();
  const addWasteLineMutation = useAddWasteLine();

  const inventory = detailQuery.data;
  const canEdit = inventory?.status?.toUpperCase() === "DRAFT";
  const untouchedLineIds = useMemo(() => (inventory ? getUntouchedInventoryLineIds(inventory.id) : new Set<string>()), [inventory]);

  const productOptions = useMemo(() => {
    const products = productsQuery.data?.items ?? [];
    return products.map((product) => ({
      id: product.id,
      label: `${product.name}${product.isActive ? "" : " (Inactive)"}`,
    }));
  }, [productsQuery.data?.items]);

  const productNameById = useMemo(() => {
    const products = productsQuery.data?.items ?? [];
    return products.reduce<Record<string, string>>((acc, product) => {
      acc[product.id] = product.name;
      return acc;
    }, {});
  }, [productsQuery.data?.items]);

  const availableStockByProduct = useMemo(() => {
    const lots = lotsQuery.data?.items ?? [];
    return buildAvailableStockByProduct(lots);
  }, [lotsQuery.data?.items]);

  const getExpectedQuantity = useCallback(
    (line: InventoryLine) => {
      if (inventory?.status?.toUpperCase() === "DRAFT") {
        return getDraftInventoryExpectedQuantity(line.productId, availableStockByProduct);
      }

      return line.theoreticalQuantity;
    },
    [availableStockByProduct, inventory?.status],
  );

  const isLineCounted = useCallback(
    (line: InventoryLine) => {
      if (inventory?.status?.toUpperCase() !== "DRAFT") {
        return true;
      }

      return !untouchedLineIds.has(line.id);
    },
    [inventory?.status, untouchedLineIds],
  );

  const displayedLines = useMemo(() => {
    if (!inventory) return [];

    const byProduct = filters.productId
      ? inventory.lines.filter((line) => line.productId === filters.productId)
      : inventory.lines;

    const sorted = [...byProduct];
    if (filters.sort === "delta_desc") {
      sorted.sort((a, b) => {
        const aCounted = isLineCounted(a);
        const bCounted = isLineCounted(b);
        if (aCounted !== bCounted) {
          return aCounted ? -1 : 1;
        }

        return (b.realQuantity - getExpectedQuantity(b)) - (a.realQuantity - getExpectedQuantity(a));
      });
    } else if (filters.sort === "delta_asc") {
      sorted.sort((a, b) => {
        const aCounted = isLineCounted(a);
        const bCounted = isLineCounted(b);
        if (aCounted !== bCounted) {
          return aCounted ? -1 : 1;
        }

        return (a.realQuantity - getExpectedQuantity(a)) - (b.realQuantity - getExpectedQuantity(b));
      });
    } else if (filters.sort === "product_asc") {
      sorted.sort((a, b) => (productNameById[a.productId] ?? "").localeCompare(productNameById[b.productId] ?? ""));
    }

    return sorted;
  }, [filters.productId, filters.sort, getExpectedQuantity, inventory, isLineCounted, productNameById]);

  const countedLines = useMemo(() => {
    if (!inventory) return 0;
    return inventory.lines.filter((line) => isLineCounted(line)).length;
  }, [inventory, isLineCounted]);

  const discrepancyCount = useMemo(() => {
    if (!inventory) return 0;
    return inventory.lines.filter((line) => isLineCounted(line) && line.realQuantity !== getExpectedQuantity(line)).length;
  }, [getExpectedQuantity, inventory, isLineCounted]);

  const totalAbsoluteDelta = useMemo(() => {
    if (!inventory) return 0;
    return inventory.lines.reduce((sum, line) => {
      if (!isLineCounted(line)) {
        return sum;
      }

      return sum + Math.abs(line.realQuantity - getExpectedQuantity(line));
    }, 0);
  }, [getExpectedQuantity, inventory, isLineCounted]);

  const totalLines = inventory?.lines.length ?? 0;
  const hasInventoryLines = totalLines > 0;
  const progressRatio = hasInventoryLines ? countedLines / totalLines : 0;
  const remainingLinesToCount = Math.max(totalLines - countedLines, 0);

  const eligibleLotsByProduct = useMemo(() => {
    const lots = lotsQuery.data?.items ?? [];
    const map = new Map<string, Array<{ id: string; remainingQuantity: number }>>();

    for (const lot of lots) {
      const remainingQuantity = getLotRemainingQuantity(lot);
      if (remainingQuantity <= 0 || isLotExpired(lot.expiryDate)) {
        continue;
      }

      const entries = map.get(lot.productId) ?? [];
      entries.push({ id: lot.id, remainingQuantity });
      map.set(lot.productId, entries);
    }

    return map;
  }, [lotsQuery.data?.items]);

  const handleAddOrEditLine = useCallback(
    async (values: { productId: string; realQuantity: number }) => {
      if (!inventory) return;

      try {
        if (lineDialogState?.mode === "edit") {
          await updateLineMutation.mutateAsync({
            inventoryId: inventory.id,
            lineId: lineDialogState.line.id,
            realQuantity: values.realQuantity,
          });
          markInventoryLinesAsCounted(inventory.id, [lineDialogState.line.id]);
          toast.success("Article d’inventaire mis à jour.");
        } else {
          const createdLine = await upsertLineMutation.mutateAsync({
            inventoryId: inventory.id,
            payload: {
              productId: values.productId,
              realQuantity: values.realQuantity,
            },
          });
          markInventoryLinesAsCounted(inventory.id, [createdLine.id]);
          toast.success("Article d’inventaire ajouté.");
        }

        setLineDialogState(null);
      } catch (error) {
        const apiError = error as unknown as ApiError;
        toast.error(getApiErrorMessage(apiError, "Impossible d’enregistrer cet article. Réessayez."));
      }
    },
    [inventory, lineDialogState, updateLineMutation, upsertLineMutation],
  );

  const handleDeleteLine = useCallback(async () => {
    if (!inventory || !deleteTarget) return;

    try {
      await deleteLineMutation.mutateAsync({
        inventoryId: inventory.id,
        lineId: deleteTarget.id,
      });
      removeInventoryLineFromDraftProgress(inventory.id, deleteTarget.id);
      toast.success("Article d’inventaire supprimé.");
      setDeleteTarget(null);
    } catch (error) {
      const apiError = error as unknown as ApiError;
      toast.error(getApiErrorMessage(apiError, "Impossible de supprimer cet article. Réessayez."));
    }
  }, [deleteLineMutation, deleteTarget, inventory]);

  const handlePostInventory = useCallback(async () => {
    if (!inventory) return;
    if (remainingLinesToCount > 0) {
      toast.error("Terminez la saisie de tous les articles avant de valider l’inventaire.");
      return;
    }

    try {
      await postInventoryMutation.mutateAsync(inventory.id);
      clearInventoryDraftProgress(inventory.id);
      toast.success("Inventaire validé.");
      setIsPostDialogOpen(false);
    } catch (error) {
      const apiError = error as unknown as ApiError;
      toast.error(getApiErrorMessage(apiError, "Impossible de valider cet inventaire."));
    }
  }, [inventory, postInventoryMutation, remainingLinesToCount]);

  const handleUseTheoreticalForLine = useCallback(
    async (line: InventoryLine) => {
      const expectedQuantity = getExpectedQuantity(line);
      if (!inventory || !canEdit || (isLineCounted(line) && line.realQuantity === expectedQuantity)) return;

      try {
        await updateLineMutation.mutateAsync({
          inventoryId: inventory.id,
          lineId: line.id,
          realQuantity: expectedQuantity,
        });
        markInventoryLinesAsCounted(inventory.id, [line.id]);
        toast.success("Quantité réelle préremplie avec le stock attendu.");
      } catch (error) {
        const apiError = error as unknown as ApiError;
        toast.error(getApiErrorMessage(apiError, "Impossible de mettre à jour cet article."));
      }
    },
    [canEdit, getExpectedQuantity, inventory, isLineCounted, updateLineMutation],
  );

  const handlePrefillAllLines = useCallback(async () => {
    if (!inventory || !canEdit) return;

    const linesToUpdate = inventory.lines.filter((line) => !isLineCounted(line) || line.realQuantity !== getExpectedQuantity(line));
    if (linesToUpdate.length === 0) {
      toast.success("Tous les articles utilisent déjà le stock attendu.");
      return;
    }

    try {
      await Promise.all(
        linesToUpdate.map((line) =>
          updateLineMutation.mutateAsync({
            inventoryId: inventory.id,
            lineId: line.id,
            realQuantity: getExpectedQuantity(line),
          }),
        ),
      );
      markInventoryLinesAsCounted(
        inventory.id,
        linesToUpdate.map((line) => line.id),
      );
      toast.success("Les articles ont été préremplis avec le stock attendu.");
    } catch (error) {
      const apiError = error as unknown as ApiError;
      toast.error(getApiErrorMessage(apiError, "Impossible de préremplir les articles."));
    }
  }, [canEdit, getExpectedQuantity, inventory, isLineCounted, updateLineMutation]);

  const handleCreateWasteFromDelta = useCallback(
    async (line: InventoryLine) => {
      if (!isLineCounted(line)) {
        return;
      }

      const missingQuantity = getExpectedQuantity(line) - line.realQuantity;
      if (missingQuantity <= 0) return;

      const eligibleLots = eligibleLotsByProduct.get(line.productId) ?? [];
      if (eligibleLots.length !== 1 || eligibleLots[0].remainingQuantity < missingQuantity) {
        toast.error("Impossible de créer automatiquement la perte. Passez par le module Pertes pour choisir le lot.");
        return;
      }

      try {
        const session = await createWasteSessionMutation.mutateAsync({
          wasteDate: inventory?.inventoryDate ?? new Date().toISOString().slice(0, 10),
          comment: `Depuis inventaire ${inventory?.inventoryDate ?? ""}`.trim(),
        });

        await addWasteLineMutation.mutateAsync({
          sessionId: session.id,
          payload: {
            lotId: eligibleLots[0].id,
            quantity: missingQuantity,
            reason: "Erreur inventaire",
          },
        });

        toast.success("Brouillon de perte créé à partir de l’écart.");
        navigate(`/app/waste-sessions/${session.id}`);
      } catch (error) {
        const apiError = error as unknown as ApiError;
        toast.error(getApiErrorMessage(apiError, "Impossible de créer la perte depuis cet écart."));
      }
    },
    [addWasteLineMutation, createWasteSessionMutation, eligibleLotsByProduct, getExpectedQuantity, inventory?.inventoryDate, isLineCounted, navigate],
  );

  if (!inventoryId) {
    return (
      <section className="mx-auto w-full max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Inventaire introuvable</CardTitle>
          </CardHeader>
        </Card>
      </section>
    );
  }

  if (detailQuery.isLoading || productsQuery.isLoading) {
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

  if (detailQuery.isError || productsQuery.isError || !inventory) {
    const apiError = (detailQuery.error ?? productsQuery.error) as unknown as ApiError;

    return (
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Inventaire</h1>
          <p className="text-sm text-muted-foreground">Consultez les écarts comptés et validez l’inventaire une fois prêt.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Impossible de charger l’inventaire</CardTitle>
            <CardDescription>{getApiErrorMessage(apiError, "Une erreur inattendue est survenue.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void Promise.all([detailQuery.refetch(), productsQuery.refetch()])}>Réessayer</Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span>Inventaire</span>
            <InventoryStatusBadge status={inventory.status} />
          </span>
        }
        description="Retrouvez les écarts comptés et validez l'inventaire quand tout est prêt."
        actions={
          <>
            <DetailBackLink to="/app/inventories" label="Retour aux inventaires" />
            {canEdit ? (
              <Button
                onClick={() => setIsPostDialogOpen(true)}
                disabled={inventory.lines.length === 0 || postInventoryMutation.isPending || remainingLinesToCount > 0}
              >
                {postInventoryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {postInventoryMutation.isPending ? "Validation..." : "Valider l'inventaire"}
              </Button>
            ) : null}
          </>
        }
      />

      <SectionCard title="Détails de l'inventaire" description="Un inventaire en brouillon reste modifiable jusqu'à sa validation.">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Date</p>
            <p className="font-medium">{formatDate(inventory.inventoryDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Statut</p>
            <InventoryStatusBadge status={inventory.status} />
          </div>
          <div>
            <p className="text-muted-foreground">Créé le</p>
            <p className="font-medium">{formatDate(inventory.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Articles</p>
            <p className="font-medium">{inventory.lines.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{hasInventoryLines ? "Produits comptés" : "Progression"}</p>
            <p className="font-medium">
              {hasInventoryLines ? `${countedLines} / ${totalLines}` : "Aucun article d’inventaire"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Écarts détectés</p>
            <p className="font-medium">{discrepancyCount}</p>
          </div>
          {shouldShowPostedBy(inventory.status) ? (
            <div>
              <p className="text-muted-foreground">Valide par</p>
              <p className="font-medium">{inventory.postedByName ?? "—"}</p>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <p className="text-muted-foreground">Commentaire</p>
            <p className="font-medium">{inventory.comment ?? "—"}</p>
          </div>
        </div>
        {hasInventoryLines ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression de saisie</span>
              <span className="font-medium">{Math.round(progressRatio * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressRatio * 100}%` }} />
            </div>
            {canEdit && remainingLinesToCount > 0 ? (
              <p className="text-xs text-muted-foreground">
                Il reste {remainingLinesToCount} produit(s) à compter avant de pouvoir valider l’inventaire.
              </p>
            ) : null}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Articles d'inventaire"
        description="Comparez les quantités prévues et comptées produit par produit."
        className="border-border/70"
        actions={canEdit ? (
            <>
              <Button variant="outline" onClick={() => void handlePrefillAllLines()} disabled={updateLineMutation.isPending || inventory.lines.length === 0}>
                Utiliser le stock attendu
              </Button>
              <Button onClick={() => setLineDialogState({ mode: "create" })}>
                <Plus className="h-4 w-4" />
                Ajouter un article
              </Button>
            </>
          ) : null}
      >
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="inventory-line-product-filter">Produit</label>
              <select
                id="inventory-line-product-filter"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={filters.productId}
                onChange={(event) => setFilters({ productId: event.target.value })}
              >
                <option value="">Tous les produits</option>
                {productOptions.map((product) => (
                  <option key={product.id} value={product.id}>{product.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="inventory-line-sort">Tri</label>
              <select
                id="inventory-line-sort"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={filters.sort}
                onChange={(event) => setFilters({ sort: event.target.value })}
              >
                <option value="">Par défaut</option>
                <option value="delta_desc">Écart décroissant</option>
                <option value="delta_asc">Écart croissant</option>
                <option value="product_asc">Produit A-Z</option>
              </select>
            </div>
          </div>

          {displayedLines.length === 0 ? (
            canEdit ? (
              <EmptyStateCard
                title="Aucun article pour le moment"
                description="Aucun article d’inventaire n’a été généré pour cette session."
                ctaLabel="Ajouter un article"
                onCtaClick={() => setLineDialogState({ mode: "create" })}
              />
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center">
                <p className="text-sm font-medium text-foreground">Aucun article enregistré</p>
                <p className="mt-1 text-sm text-muted-foreground">Cet inventaire validé est désormais en lecture seule.</p>
              </div>
            )
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Théorique</TableHead>
                    <TableHead>Réel</TableHead>
                    <TableHead>Écart</TableHead>
                    <TableHead className="w-[220px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedLines.map((line) => {
                    const counted = isLineCounted(line);
                    const expectedQuantity = getExpectedQuantity(line);
                    const delta = line.realQuantity - expectedQuantity;
                    const deltaStyles = counted
                      ? getDeltaStyles(delta)
                      : {
                          row: "bg-muted/20",
                          badge: "border-border bg-background text-muted-foreground",
                        };

                    return (
                      <TableRow key={line.id} className={deltaStyles.row}>
                        <TableCell className="font-medium">{productNameById[line.productId] ?? "Produit non chargé"}</TableCell>
                        <TableCell>
                          <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium">
                            {expectedQuantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          {counted ? (
                            <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium">
                              {line.realQuantity}
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full border border-dashed border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                              À saisir
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${deltaStyles.badge}`}>
                            {counted ? formatDelta(delta) : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/app/catalog/${line.productId}`}>Voir le produit</Link>
                            </Button>
                            {canEdit ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="icon" variant="ghost" disabled={deleteLineMutation.isPending}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem disabled={counted && line.realQuantity === expectedQuantity} onSelect={() => void handleUseTheoreticalForLine(line)}>
                                    Utiliser le stock attendu
                                  </DropdownMenuItem>
                                  {counted && delta < 0 ? (
                                    <DropdownMenuItem
                                      disabled={
                                        (eligibleLotsByProduct.get(line.productId) ?? []).length !== 1 ||
                                        (eligibleLotsByProduct.get(line.productId)?.[0]?.remainingQuantity ?? 0) < Math.abs(delta)
                                      }
                                      onSelect={() => void handleCreateWasteFromDelta(line)}
                                    >
                                      Déclarer en pertes
                                    </DropdownMenuItem>
                                  ) : null}
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
                          </div>
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
        <InventoryLineDialog
          open={lineDialogState !== null}
          mode={lineDialogState?.mode ?? "create"}
          productOptions={productOptions}
          defaultLine={lineDialogState?.mode === "edit" ? lineDialogState.line : null}
          pending={upsertLineMutation.isPending || updateLineMutation.isPending}
          onOpenChange={(open) => {
            if (!open) setLineDialogState(null);
          }}
          onSubmit={handleAddOrEditLine}
        />

        <PostInventoryDialog
          open={isPostDialogOpen}
          pending={postInventoryMutation.isPending}
          linesCount={inventory.lines.length}
          countedLines={countedLines}
          discrepancyCount={discrepancyCount}
          totalAbsoluteDelta={totalAbsoluteDelta}
          onOpenChange={setIsPostDialogOpen}
          onConfirm={handlePostInventory}
        />

        <DeleteInventoryLineDialog
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
