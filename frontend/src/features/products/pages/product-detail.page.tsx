import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ClipboardList, PackagePlus, ReceiptText, ShoppingBasket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoriesList } from "@/features/categories/api/categories.queries";
import { useInventoriesList } from "@/features/inventories/api/inventories.queries";
import { useLotsList } from "@/features/lots/api/lots.queries";
import { LotsTable } from "@/features/lots/components/LotsTable";
import { getLotExpiryVariant, getLotRemainingQuantity, getProductStockFromLots } from "@/features/lots/lots-stock.utils";
import { useAddProductToDraftOrder, useOrdersAll } from "@/features/orders/api/orders.queries";
import { useProductsAll } from "@/features/products/api/products.queries";
import { useReceptionsList } from "@/features/receptions/api/receptions.queries";
import { useSuppliersAll } from "@/features/suppliers/api/suppliers.queries";
import {
  useAddWasteLine,
  useCreateWasteSession,
  usePostWasteSession,
} from "@/features/waste-sessions/api/wasteSessions.queries";
import { useWasteSessionsList } from "@/features/waste-sessions/api/wasteSessions.queries";
import type { ApiError } from "@/shared/api/apiClient";
import { DetailBackLink } from "@/shared/ui/detail-back-link";
import { MetricValue } from "@/shared/ui/metric-value";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionCard } from "@/shared/ui/section-card";
import type { LotListItem } from "@/features/lots/lots.types";

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 404) return "Produit introuvable.";
  if (error.status === 400) return error.message ?? "Requête invalide.";
  if (error.status === 401) return "Votre session a expiré.";
  return error.message ?? fallback;
}

function formatCurrency(value: number): string {
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

function formatDate(value?: string): string {
  if (!value) return "Date non disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getLotAttentionLevel(expiryDate?: string, hasIssue?: boolean): "issue" | "soon" | "none" {
  if (hasIssue) {
    return "issue";
  }

  const expiryVariant = getLotExpiryVariant(expiryDate);
  if (expiryVariant === "expired") {
    return "issue";
  }
  if (expiryVariant === "soon") {
    return "soon";
  }

  return "none";
}

export function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  const productId = params.productId ?? "";
  const navigate = useNavigate();
  const ordersQuery = useOrdersAll();
  const addProductToDraftOrderMutation = useAddProductToDraftOrder();
  const [wasteLot, setWasteLot] = useState<LotListItem | null>(null);
  const [wasteQuantity, setWasteQuantity] = useState("0");
  const [wasteReason, setWasteReason] = useState("Expiration");

  const productsQuery = useProductsAll();
  const categoriesQuery = useCategoriesList({ page: 1, pageSize: 200 });
  const lotsQuery = useLotsList({ page: 1, pageSize: 200, productId });
  const receptionsQuery = useReceptionsList({ page: 1, pageSize: 200 });
  const suppliersQuery = useSuppliersAll();
  const wasteQuery = useWasteSessionsList({ page: 1, pageSize: 20, productId });
  const inventoriesQuery = useInventoriesList({ page: 1, pageSize: 20, productId });
  const createWasteSessionMutation = useCreateWasteSession();
  const addWasteLineMutation = useAddWasteLine();
  const postWasteSessionMutation = usePostWasteSession();
  const orders = useMemo(() => ordersQuery.data?.items ?? [], [ordersQuery.data?.items]);

  const product = useMemo(() => {
    return (productsQuery.data?.items ?? []).find((item) => item.id === productId) ?? null;
  }, [productId, productsQuery.data?.items]);

  const categoriesById = useMemo(() => {
    return (categoriesQuery.data?.items ?? []).reduce<Record<string, string>>((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});
  }, [categoriesQuery.data?.items]);

  const supplierNameById = useMemo(() => {
    return (suppliersQuery.data?.items ?? []).reduce<Record<string, string>>((acc, supplier) => {
      acc[supplier.id] = supplier.name;
      return acc;
    }, {});
  }, [suppliersQuery.data?.items]);

  const lots = useMemo(() => {
    const rows = lotsQuery.data?.items ?? [];
    return rows.map((lot) => ({
      ...lot,
      productName: product?.name ?? "Produit",
    }));
  }, [lotsQuery.data?.items, product?.name]);

  const stockSummary = useMemo(() => {
    return getProductStockFromLots(lots);
  }, [lots]);
  const minimumStock = product?.minimumStock ?? product?.alertThreshold ?? 0;
  const stockLevel = useMemo(() => {
    if (!product) {
      return null;
    }

    if (stockSummary.availableQuantity <= 0) {
      return {
        label: "Rupture de stock",
        tone: "text-red-700",
        panelTone: "border-red-200 bg-red-50 text-red-950",
        bodyTone: "text-red-900/80",
      };
    }

    if (stockSummary.availableQuantity < minimumStock) {
      return {
        label: "Stock bas",
        tone: "text-amber-700",
        panelTone: "border-amber-200 bg-amber-50 text-amber-950",
        bodyTone: "text-amber-900/80",
      };
    }

    return null;
  }, [minimumStock, product, stockSummary.availableQuantity]);

  const receptionIds = useMemo(() => {
    return new Set(lots.map((lot) => lot.receptionId).filter((value): value is string => Boolean(value)));
  }, [lots]);

  const recentReceptions = useMemo(() => {
    return (receptionsQuery.data?.items ?? [])
      .filter((reception) => receptionIds.has(reception.id))
      .map((reception) => ({
        ...reception,
        supplierName: reception.supplierId ? supplierNameById[reception.supplierId] ?? "Fournisseur inconnu" : "Fournisseur inconnu",
      }))
      .sort((left, right) => (right.receptionDate ?? right.createdAt ?? "").localeCompare(left.receptionDate ?? left.createdAt ?? ""))
      .slice(0, 6);
  }, [receptionsQuery.data?.items, receptionIds, supplierNameById]);

  const mainSupplierName = recentReceptions[0]?.supplierName ?? "Non renseigné";
  const lastReception = recentReceptions[0] ?? null;

  const productLotIds = useMemo(() => {
    return new Set(lots.map((lot) => lot.id));
  }, [lots]);

  const recentWaste = useMemo(() => {
    return (wasteQuery.data?.items ?? []).map((session) => {
      const productLines = session.lines.filter((line) => productLotIds.has(line.lotId));
      return {
        ...session,
        productLines,
        productQty: productLines.reduce((sum, line) => sum + line.quantity, 0),
      };
    });
  }, [productLotIds, wasteQuery.data?.items]);

  const recentInventories = useMemo(() => {
    return (inventoriesQuery.data?.items ?? []).map((inventory) => {
      const line = inventory.lines.find((item) => item.productId === productId);
      return {
        ...inventory,
        line,
        delta: line ? line.realQuantity - line.theoreticalQuantity : 0,
      };
    });
  }, [inventoriesQuery.data?.items, productId]);

  const quantityInDraft = useMemo(() => {
    const draftOrder = orders.find((order) => order.status === "DRAFT");
    return draftOrder?.lines.find((line) => line.productId === productId)?.quantityOrdered ?? 0;
  }, [orders, productId]);
  const draftOrder = useMemo(() => orders.find((order) => order.status === "DRAFT") ?? null, [orders]);
  const lotSummary = useMemo(() => {
    return lots.reduce(
      (acc, lot) => {
        const quantity = getLotRemainingQuantity(lot);
        if (quantity <= 0) {
          return acc;
        }

        acc.activeLots += 1;

        const attentionLevel = getLotAttentionLevel(lot.expiryDate, lot.hasIssue);
        if (attentionLevel === "issue") {
          acc.alertLots += 1;
        }
        if (attentionLevel === "soon") {
          acc.soonLots += 1;
        }

        return acc;
      },
      { activeLots: 0, alertLots: 0, soonLots: 0 },
    );
  }, [lots]);

  const handleRecommend = useCallback(async () => {
    if (!product) {
      return;
    }

    const order = await addProductToDraftOrderMutation.mutateAsync({
      productId: product.id,
      quantity: 1,
      unitPrice: stockSummary.latestUnitPrice,
    });
    toast.success("Produit ajouté à la commande en brouillon.", {
      action: {
        label: "Ouvrir",
        onClick: () => {
          navigate(`/app/orders/${order.id}`);
        },
      },
    });
  }, [addProductToDraftOrderMutation, navigate, product, stockSummary.latestUnitPrice]);

  const handleOpenWasteDialog = useCallback((lot: LotListItem) => {
    setWasteLot(lot);
    setWasteQuantity(String(getLotRemainingQuantity(lot)));
    setWasteReason("Expiration");
  }, []);

  const handleCloseWasteDialog = useCallback((open: boolean) => {
    if (!open) {
      setWasteLot(null);
    }
  }, []);

  const handleDeclareWaste = useCallback(async () => {
    if (!wasteLot) {
      return;
    }

    const quantity = Number(wasteQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Saisissez une quantité valide.");
      return;
    }

    try {
      const session = await createWasteSessionMutation.mutateAsync({
        wasteDate: new Date().toISOString().slice(0, 10),
        comment: `Lot ${wasteLot.lotCode ?? wasteLot.id}`,
      });

      await addWasteLineMutation.mutateAsync({
        sessionId: session.id,
        payload: {
          lotId: wasteLot.id,
          quantity,
          reason: wasteReason.trim() || "Expiration",
        },
      });

      await postWasteSessionMutation.mutateAsync(session.id);

      toast.success("Perte enregistrée.");
      setWasteLot(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error as ApiError, "Impossible d’enregistrer cette perte."));
    }
  }, [addWasteLineMutation, createWasteSessionMutation, postWasteSessionMutation, wasteLot, wasteQuantity, wasteReason]);

  if (!productId) {
    return (
      <section className="page-shell">
        <Card>
          <CardHeader>
            <CardTitle>Produit introuvable</CardTitle>
          </CardHeader>
        </Card>
      </section>
    );
  }

  if (
    productsQuery.isLoading ||
    categoriesQuery.isLoading ||
    lotsQuery.isLoading ||
    receptionsQuery.isLoading ||
    suppliersQuery.isLoading ||
    wasteQuery.isLoading ||
    inventoriesQuery.isLoading
  ) {
    return (
      <section className="page-shell-wide space-y-6">
        <div className="page-hero space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 rounded-[24px]" />
          <Skeleton className="h-32 rounded-[24px]" />
          <Skeleton className="h-32 rounded-[24px]" />
        </div>
        <Skeleton className="h-80 rounded-[24px]" />
      </section>
    );
  }

  if (
    productsQuery.isError ||
    categoriesQuery.isError ||
    lotsQuery.isError ||
    receptionsQuery.isError ||
    suppliersQuery.isError ||
    wasteQuery.isError ||
    inventoriesQuery.isError ||
    !product
  ) {
    const apiError = (
      productsQuery.error ??
      categoriesQuery.error ??
      lotsQuery.error ??
      receptionsQuery.error ??
      suppliersQuery.error ??
      wasteQuery.error ??
      inventoriesQuery.error ??
      { status: 404, message: "Produit introuvable." }
    ) as unknown as ApiError;

    return (
      <section className="page-shell">
        <PageHeader title="Produit" description="Retrouvez le stock, les lots et les mouvements utiles pour ce produit." />
        <SectionCard title="Impossible d'ouvrir le produit" description={getApiErrorMessage(apiError, "Une erreur inattendue est survenue.")}>
          <Button
            onClick={() =>
              void Promise.all([
                productsQuery.refetch(),
                categoriesQuery.refetch(),
                lotsQuery.refetch(),
                receptionsQuery.refetch(),
                suppliersQuery.refetch(),
                wasteQuery.refetch(),
                inventoriesQuery.refetch(),
              ])
            }
          >
            Réessayer
          </Button>
        </SectionCard>
      </section>
    );
  }

  return (
    <section className="page-shell-wide space-y-6">
      <section className="page-hero border border-border/70 bg-slate-100 text-slate-950 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.35)]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <DetailBackLink
              to="/app/catalog"
              label="Retour au catalogue"
              className="border-slate-200 bg-white text-slate-950 hover:bg-slate-50"
            />
            <Button asChild variant="secondary" className="border-0 bg-white text-slate-900 hover:bg-white/92">
              <a href="#lots-disponibles">Voir les lots</a>
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">
              {categoriesById[product.categoryId] ?? "Sans catégorie"}
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em]">{product.name}</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Consultez ici le stock disponible, les lots actifs et les derniers mouvements utiles pour ce produit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleRecommend}>
              <ShoppingBasket className="h-4 w-4" />
              Ajouter à la commande
            </Button>
            {draftOrder ? (
              <Button asChild variant="secondary" className="border-0 bg-white text-slate-900 hover:bg-white/92">
                <Link to={`/app/orders/${draftOrder.id}`}>Ouvrir la commande en cours</Link>
              </Button>
            ) : (
              <Button asChild variant="secondary" className="border-0 bg-white text-slate-900 hover:bg-white/92">
                <Link to="/app/orders">Ouvrir les commandes</Link>
              </Button>
            )}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <PackagePlus className="h-4 w-4" />
              {quantityInDraft > 0 ? `${quantityInDraft} déjà dans la commande` : "Pas encore dans la commande"}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] border border-white/70 bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Stock disponible</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {formatQuantity(stockSummary.availableQuantity)} {product.unit}
              </p>
              <p className="mt-1 text-sm text-slate-600">Cumule sur les lots encore utilisables.</p>
            </div>
            <div className="rounded-[22px] border border-white/70 bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Valeur du stock</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{formatCurrency(stockSummary.availableValue)}</p>
              <p className="mt-1 text-sm text-slate-600">Calculee a partir des couts connus sur les lots.</p>
            </div>
            <div className="rounded-[22px] border border-white/70 bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Commande en cours</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {quantityInDraft > 0 ? `${formatQuantity(quantityInDraft)} ${product.unit}` : "Aucune"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {quantityInDraft > 0 ? "Ce produit est déjà prévu dans la commande." : "Ajoutez-le si vous devez recommander."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {stockLevel ? (
        <div className={`flex items-start gap-3 rounded-[24px] border p-4 ${stockLevel.panelTone}`}>
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <div>
            <p className="text-sm font-medium">{stockLevel.label}</p>
            <p className={`text-sm ${stockLevel.bodyTone}`}>
              Il reste {formatQuantity(stockSummary.availableQuantity)} {product.unit} pour un seuil minimum de {formatQuantity(minimumStock)}.
            </p>
            {stockSummary.expiredQuantity > 0 ? (
              <p className={`mt-1 text-sm ${stockLevel.bodyTone}`}>
                {formatQuantity(stockSummary.expiredQuantity)} {product.unit} en lots expirés.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <SectionCard title="Informations produit" description="Les repères utiles pour acheter et suivre ce produit.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Catégorie</p>
            <p className="mt-2 text-base font-semibold text-foreground">{categoriesById[product.categoryId] ?? "Sans catégorie"}</p>
          </div>
          <div className="rounded-2xl bg-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Format</p>
            <p className="mt-2 text-base font-semibold text-foreground">{product.unit}</p>
          </div>
          <div className="rounded-2xl bg-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Fournisseur principal</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {mainSupplierName}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Déduit des réceptions récentes de ce produit.</p>
          </div>
          <div className="rounded-2xl bg-muted/70 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Derniere livraison</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {lastReception ? formatDate(lastReception.receptionDate ?? lastReception.createdAt) : "Aucune réception"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{lastReception?.supplierName ?? "Aucun fournisseur récent"}</p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Disponible maintenant" description="Stock cumule sur les lots encore actifs.">
          <p className="text-3xl font-semibold tracking-[-0.04em]">
            {formatQuantity(stockSummary.availableQuantity)} {product.unit}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              Seuil minimum : <span className="font-medium text-foreground">{formatQuantity(minimumStock)} {product.unit}</span>
            </p>
            {stockSummary.expiredQuantity > 0 ? (
              <p className="text-amber-700">
                {`⚠ ${formatQuantity(stockSummary.expiredQuantity)} ${product.unit} en lots expirés`}
              </p>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="Valeur du stock" description="Valeur calculee a partir des couts unitaires renseignes sur les lots.">
          <MetricValue size="xl">{formatCurrency(stockSummary.availableValue)}</MetricValue>
        </SectionCard>

        <SectionCard title="Prix unitaire de repère" description="Dernier cout connu sur les lots charges pour ce produit.">
          <MetricValue size="xl" placeholder={stockSummary.latestUnitPrice === null}>
            {stockSummary.latestUnitPrice === null ? "Non renseigné" : formatCurrency(stockSummary.latestUnitPrice)}
          </MetricValue>
        </SectionCard>
      </div>

      <div id="lots-disponibles">
        <SectionCard title="Lots disponibles" description={`${lots.length} lot(s) reliés à ce produit`}>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-[18px] border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Lots actifs</p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground">{lotSummary.activeLots}</p>
              <p className="mt-1 text-sm text-muted-foreground">Lots avec quantité encore disponible.</p>
            </div>
            <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-800">A suivre</p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-amber-950">{lotSummary.soonLots}</p>
              <p className="mt-1 text-sm text-amber-900/80">Lots proches de la date ou a surveiller.</p>
            </div>
            <div className="rounded-[18px] border border-red-200 bg-red-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-red-700">A traiter</p>
              <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-red-950">{lotSummary.alertLots}</p>
              <p className="mt-1 text-sm text-red-900/80">Lots signalés ou déjà expirés.</p>
            </div>
          </div>

          {lots.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Aucun lot actif pour ce produit. Passez par une réception pour enregistrer une nouvelle entrée.
            </p>
          ) : (
            <LotsTable items={lots} showReception onDeclareWaste={handleOpenWasteDialog} />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Réceptions récentes" description="Dernières réceptions qui ont alimenté ce produit.">
          {recentReceptions.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Aucune réception reliée à ce produit dans les données chargées.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentReceptions.map((reception) => (
                <li key={reception.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/70 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{reception.supplierName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(reception.receptionDate ?? reception.createdAt)}
                      {reception.reference ? ` · ${reception.reference}` : ""}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/app/receptions/${reception.id}`}>
                      <ReceiptText className="h-4 w-4" />
                      Ouvrir
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Pertes récentes" description="Dernières sorties anormales relevées pour ce produit.">
          {recentWaste.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Aucune perte récente reliée à ce produit.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentWaste.map((session) => (
                <li key={session.id} className="rounded-xl border border-border/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatDate(session.wasteDate)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatQuantity(session.productQty)} {product.unit} sur {session.productLines.length} lot(s)
                      </p>
                    </div>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/app/waste-sessions/${session.id}`}>
                        <Trash2 className="h-4 w-4" />
                        Ouvrir
                      </Link>
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {session.productLines.map((line) => line.reason).filter(Boolean).slice(0, 3).join(" · ") || "Motif non renseigné"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Contrôles récents" description="Derniers inventaires dans lesquels ce produit a été contrôlé.">
        {recentInventories.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Aucun inventaire récent relié à ce produit.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recentInventories.map((inventory) => (
              <article key={inventory.id} className="rounded-xl border border-border/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{formatDate(inventory.inventoryDate)}</p>
                    <p className="text-xs text-muted-foreground">{inventory.status}</p>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/app/inventories/${inventory.id}`}>
                      <ClipboardList className="h-4 w-4" />
                      Ouvrir
                    </Link>
                  </Button>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <p>
                    Stock attendu : <span className="font-medium">{formatQuantity(inventory.line?.theoreticalQuantity ?? 0)}</span>
                  </p>
                  <p>
                    Stock compte : <span className="font-medium">{formatQuantity(inventory.line?.realQuantity ?? 0)}</span>
                  </p>
                  <p className={inventory.delta === 0 ? "text-muted-foreground" : inventory.delta > 0 ? "text-emerald-700" : "text-amber-700"}>
                    Ecart : {inventory.delta > 0 ? "+" : ""}
                    {formatQuantity(inventory.delta)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      {((lotsQuery.data?.total ?? lots.length) > lots.length ||
        (receptionsQuery.data?.total ?? recentReceptions.length) > (receptionsQuery.data?.items ?? []).length ||
        (wasteQuery.data?.total ?? recentWaste.length) > recentWaste.length ||
        (inventoriesQuery.data?.total ?? recentInventories.length) > recentInventories.length) ? (
        <p className="text-xs text-muted-foreground">
          Cette page synthétise les donnees chargees actuellement. Certains historiques longs peuvent etre tronques par les limites de chargement en place.
        </p>
      ) : null}

      <SectionCard title="Commande et achat" description="Retrouvez ici le lien entre ce produit, la commande en cours et les dernières livraisons.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[20px] border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Fournisseur principal</p>
            <p className="mt-2 text-base font-semibold text-foreground">{mainSupplierName}</p>
            <p className="mt-1 text-sm text-muted-foreground">Déduit des réceptions récentes de ce produit.</p>
          </div>
          <div className="rounded-[20px] border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Commande en cours</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {quantityInDraft > 0 ? `${formatQuantity(quantityInDraft)} ${product.unit} déjà prévu(s)` : "Pas encore ajouté"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Ajoutez ce produit a la commande pour preparer le prochain achat.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={handleRecommend}>
                <ShoppingBasket className="h-4 w-4" />
                Ajouter à la commande
              </Button>
              {draftOrder ? (
                <Button asChild size="sm" variant="outline">
                  <Link to={`/app/orders/${draftOrder.id}`}>Ouvrir la commande</Link>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="rounded-[20px] border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dernière réception</p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {lastReception ? formatDate(lastReception.receptionDate ?? lastReception.createdAt) : "Aucune réception"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{lastReception?.supplierName ?? "Aucun fournisseur récent"}</p>
          </div>
        </div>
      </SectionCard>

      <Dialog open={wasteLot !== null} onOpenChange={handleCloseWasteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Déclarer en pertes</DialogTitle>
            <DialogDescription>
              Enregistrez ce lot en pertes pour qu'il soit traité explicitement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-[18px] border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-950">{product.name}</p>
              <p className="mt-1 text-sm text-red-900/80">
                {wasteLot?.lotCode ? `Lot ${wasteLot.lotCode}` : "Lot sans code"} · {formatQuantity(getLotRemainingQuantity(wasteLot ?? { quantityInitial: 0, productId: "", id: "" }))} {product.unit}
              </p>
            </div>

            <label className="space-y-2">
              <span className="block text-sm font-medium text-foreground">Quantité</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={wasteQuantity}
                onChange={(event) => setWasteQuantity(event.target.value)}
                disabled={createWasteSessionMutation.isPending || addWasteLineMutation.isPending || postWasteSessionMutation.isPending}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-medium text-foreground">Motif</span>
              <Input
                value={wasteReason}
                onChange={(event) => setWasteReason(event.target.value)}
                disabled={createWasteSessionMutation.isPending || addWasteLineMutation.isPending || postWasteSessionMutation.isPending}
              />
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setWasteLot(null)}
              disabled={createWasteSessionMutation.isPending || addWasteLineMutation.isPending || postWasteSessionMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => void handleDeclareWaste()}
              disabled={createWasteSessionMutation.isPending || addWasteLineMutation.isPending || postWasteSessionMutation.isPending}
            >
              Déclarer en pertes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
