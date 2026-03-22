import { useEffect, useMemo } from "react";
import { ArrowRight, ShoppingCart, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInventoriesList } from "@/features/inventories/api/inventories.queries";
import type { Inventory } from "@/features/inventories/api/inventories.types";
import { useOperationalToday } from "@/features/operational/api/operational.queries";
import { useOrdersAll } from "@/features/orders/api/orders.queries";
import { formatOrderCurrency, getOrderEstimatedTotal, getOrderStatusLabel, getOrderStatusTone } from "@/features/orders/orders.utils";
import { useReceptionsList } from "@/features/receptions/api/receptions.queries";
import type { ReceptionListItem } from "@/features/receptions/receptions.types";
import { useSuppliersAll } from "@/features/suppliers/api/suppliers.queries";
import { useWasteSessionsList } from "@/features/waste-sessions/api/wasteSessions.queries";
import type { WasteSession } from "@/features/waste-sessions/api/wasteSessions.types";
import type { ApiError } from "@/shared/api/apiClient";
import { MetricValue } from "@/shared/ui/metric-value";
import { ModuleHeroHeader } from "@/shared/ui/module-hero-header";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionCard } from "@/shared/ui/section-card";

type ActivityItem = {
  id: string;
  label: string;
  meta: string;
  to: string;
};

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 400) return error.message ?? "Requête invalide.";
  if (error.status === 401) return "Votre session a expiré.";
  return error.message ?? fallback;
}

function formatQty(value: number): string {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
}

function formatShortDate(value?: string): string {
  if (!value) return "Date inconnue";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function toTimestamp(value?: string): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

function buildReceptionActivity(item: ReceptionListItem): ActivityItem {
  const label = item.reference?.trim() ? `Livraison ${item.reference}` : "Derniere livraison";
  return {
    id: `reception-${item.id}`,
    label,
    meta: formatShortDate(item.receptionDate || item.createdAt),
    to: `/app/receptions/${item.id}`,
  };
}

function buildWasteActivity(item: WasteSession): ActivityItem {
  return {
    id: `waste-${item.id}`,
    label: "Dernière perte",
    meta: `${formatShortDate(item.wasteDate)} · ${item.lines.length} lot(s)`,
    to: `/app/waste-sessions/${item.id}`,
  };
}

function buildInventoryActivity(item: Inventory): ActivityItem {
  return {
    id: `inventory-${item.id}`,
    label: "Dernier inventaire valide",
    meta: `${formatShortDate(item.inventoryDate)} · ${item.lines.length} article(s)`,
    to: `/app/inventories/${item.id}`,
  };
}

export function TodayPage() {
  const todayQuery = useOperationalToday({ expiryDays: 3, lowStockOnly: true });
  const suppliersQuery = useSuppliersAll();
  const receptionsQuery = useReceptionsList({ page: 1, pageSize: 10 });
  const draftInventoriesQuery = useInventoriesList({ page: 1, pageSize: 5, status: "DRAFT" });
  const recentInventoriesQuery = useInventoriesList({ page: 1, pageSize: 10 });
  const draftWasteQuery = useWasteSessionsList({ page: 1, pageSize: 5, status: "DRAFT" });
  const recentWasteQuery = useWasteSessionsList({ page: 1, pageSize: 10 });

  const ordersQuery = useOrdersAll();
  const orders = useMemo(() => ordersQuery.data?.items ?? [], [ordersQuery.data?.items]);

  useEffect(() => {
    if (todayQuery.isError) {
      const apiError = todayQuery.error as unknown as ApiError;
      toast.error(getApiErrorMessage(apiError, "Impossible de charger la vue du jour."));
    }
  }, [todayQuery.error, todayQuery.isError]);

  const supplierNameById = useMemo(() => {
    return (suppliersQuery.data?.items ?? []).reduce<Record<string, string>>((acc, supplier) => {
      acc[supplier.id] = supplier.name;
      return acc;
    }, {});
  }, [suppliersQuery.data?.items]);

  const draftOrders = useMemo(() => orders.filter((order) => order.status === "DRAFT"), [orders]);
  const ordersToReceive = useMemo(
    () => orders.filter((order) => order.status === "SENT" || order.status === "PARTIALLY_RECEIVED"),
    [orders],
  );

  const currentDraftOrder = draftOrders[0] ?? null;
  const currentDraftOrderSupplier = currentDraftOrder?.supplierId ? supplierNameById[currentDraftOrder.supplierId] ?? "A attribuer" : "A attribuer";
  const currentDraftOrderTotal = currentDraftOrder ? getOrderEstimatedTotal(currentDraftOrder) : 0;

  const lowStockProducts = todayQuery.data?.lowStockProducts ?? [];
  const outOfStockProducts = lowStockProducts.filter((item) => item.currentQty <= 0);
  const draftTasksCount = draftOrders.length + (draftInventoriesQuery.data?.items?.length ?? 0) + (draftWasteQuery.data?.items?.length ?? 0);

  const recentReception = useMemo(() => {
    return [...(receptionsQuery.data?.items ?? [])]
      .sort((left, right) => toTimestamp(right.receptionDate || right.createdAt) - toTimestamp(left.receptionDate || left.createdAt))[0] ?? null;
  }, [receptionsQuery.data?.items]);

  const latestValidatedInventory = useMemo(() => {
    return (recentInventoriesQuery.data?.items ?? []).find((item) => item.status?.toUpperCase() !== "DRAFT") ?? null;
  }, [recentInventoriesQuery.data?.items]);

  const latestWaste = useMemo(() => {
    return (recentWasteQuery.data?.items ?? []).find((item) => item.status?.toUpperCase() !== "DRAFT") ?? null;
  }, [recentWasteQuery.data?.items]);

  const recentActivity = useMemo(() => {
    const items: Array<ActivityItem & { timestamp: number }> = [];

    if (recentReception) {
      items.push({ ...buildReceptionActivity(recentReception), timestamp: toTimestamp(recentReception.receptionDate || recentReception.createdAt) });
    }
    if (latestWaste) {
      items.push({ ...buildWasteActivity(latestWaste), timestamp: toTimestamp(latestWaste.wasteDate || latestWaste.createdAt) });
    }
    if (latestValidatedInventory) {
      items.push({
        ...buildInventoryActivity(latestValidatedInventory),
        timestamp: toTimestamp(latestValidatedInventory.inventoryDate || latestValidatedInventory.createdAt),
      });
    }

    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
  }, [latestValidatedInventory, latestWaste, recentReception]);

  if (todayQuery.isError) {
    const apiError = todayQuery.error as unknown as ApiError;

    return (
      <section className="page-shell-wide">
        <PageHeader title="Aujourd’hui" description="Voyez ce qui demande votre attention." />
        <SectionCard title="Impossible d'ouvrir la page du jour" description={getApiErrorMessage(apiError, "Une erreur inattendue est survenue.")}>
          <Button onClick={() => todayQuery.refetch()}>Réessayer</Button>
        </SectionCard>
      </section>
    );
  }

  return (
    <section className="page-shell-wide space-y-6">
      <ModuleHeroHeader
        eyebrow="Priorites du jour"
        title="Aujourd’hui"
        description="Voyez ce qui demande votre attention."
        tone="today"
        actions={
          <>
            <Button asChild>
              <Link to={currentDraftOrder ? `/app/orders/${currentDraftOrder.id}` : "/app/orders"}>
                <ShoppingCart className="h-4 w-4" />
                {currentDraftOrder ? "Commande en cours" : "Voir les commandes"}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/app/catalog">Ouvrir le catalogue</Link>
            </Button>
          </>
        }
        stats={[
          { label: "Produits en rupture", value: todayQuery.isLoading ? "…" : outOfStockProducts.length, help: "A remettre vite en commande" },
          { label: "Sous le seuil", value: todayQuery.isLoading ? "…" : lowStockProducts.length, help: "Produits à surveiller aujourd’hui" },
          { label: "Commandes à recevoir", value: ordersToReceive.length, help: "Livraisons à enregistrer" },
          { label: "Brouillons à terminer", value: draftTasksCount, help: "Commandes, inventaires ou pertes" },
        ]}
      />

      <SectionCard title="À traiter maintenant">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-[22px] border border-red-200 bg-red-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-red-700">Produits en rupture</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-red-900">{todayQuery.isLoading ? "…" : outOfStockProducts.length}</p>
            <p className="mt-1 text-sm text-red-900/75">À ajouter vite à la commande.</p>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link to="/app/catalog">Voir les produits</Link>
            </Button>
          </article>

          <article className="rounded-[22px] border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700">Sous le seuil</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-amber-900">{todayQuery.isLoading ? "…" : lowStockProducts.length}</p>
            <p className="mt-1 text-sm text-amber-900/75">Produits à surveiller aujourd’hui.</p>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link to="/app/catalog">Ouvrir le catalogue</Link>
            </Button>
          </article>

          <article className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-600">Commandes à envoyer</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{draftOrders.length}</p>
            <p className="mt-1 text-sm text-slate-600">Brouillons prêts à vérifier puis envoyer.</p>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link to={currentDraftOrder ? `/app/orders/${currentDraftOrder.id}` : "/app/orders"}>Ouvrir</Link>
            </Button>
          </article>

          <article className="rounded-[22px] border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-sky-700">Commandes à recevoir</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-sky-900">{ordersToReceive.length}</p>
            <p className="mt-1 text-sm text-sky-900/75">Livraisons à enregistrer depuis les commandes.</p>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link to={ordersToReceive[0] ? `/app/orders/${ordersToReceive[0].id}` : "/app/orders"}>Recevoir</Link>
            </Button>
          </article>

          <article className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Brouillons à terminer</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-emerald-900">{draftTasksCount}</p>
            <p className="mt-1 text-sm text-emerald-900/75">Commandes, inventaires ou pertes à reprendre.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/app/orders">Commandes</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/app/inventories?status=DRAFT">Inventaires</Link>
              </Button>
            </div>
          </article>
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Commande en cours" description="Le brouillon que vous pouvez reprendre tout de suite.">
          {!currentDraftOrder ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Aucune commande en cours. Passez par le catalogue pour préparer le prochain achat.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[20px] border border-border/70 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Articles</p>
                  <MetricValue>{currentDraftOrder.lines.length}</MetricValue>
                </div>
                <div className="rounded-[20px] border border-border/70 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total estimé</p>
                  <MetricValue placeholder={currentDraftOrderTotal <= 0}>
                    {currentDraftOrderTotal > 0 ? formatOrderCurrency(currentDraftOrderTotal) : "À estimer"}
                  </MetricValue>
                </div>
                <div className="rounded-[20px] border border-border/70 bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Fournisseur</p>
                  <MetricValue size="md" placeholder={currentDraftOrderSupplier === "A attribuer"}>
                    {currentDraftOrderSupplier === "A attribuer" ? "À attribuer" : currentDraftOrderSupplier}
                  </MetricValue>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-border/70 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{currentDraftOrder.reference}</p>
                  <p className="text-sm text-muted-foreground">Reprenez cette commande pour l'envoyer ou la compléter.</p>
                </div>
                <Button asChild>
                  <Link to={`/app/orders/${currentDraftOrder.id}`}>Ouvrir la commande</Link>
                </Button>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Commandes à recevoir" description="Commandes envoyées ou partiellement reçues qui attendent encore une action.">
          {ordersToReceive.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Aucune commande à recevoir pour le moment.
            </div>
          ) : (
            <ul className="space-y-3">
              {ordersToReceive.slice(0, 4).map((order) => {
                const supplierName = order.supplierId ? supplierNameById[order.supplierId] ?? "A attribuer" : "A attribuer";
                const ordered = order.lines.reduce((sum, line) => sum + line.quantityOrdered, 0);
                const received = order.lines.reduce((sum, line) => sum + line.quantityReceived, 0);
                const remaining = Math.max(ordered - received, 0);

                return (
                  <li key={order.id} className="flex items-start justify-between gap-3 rounded-[20px] border border-border/70 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{order.reference}</p>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getOrderStatusTone(order.status)}`}>
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{supplierName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Reste à recevoir : {remaining}</p>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/app/orders/${order.id}`}>
                        <Truck className="h-4 w-4" />
                        Recevoir
                      </Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Produits à surveiller" description="Quelques produits qui méritent un coup d'œil aujourd'hui.">
          {todayQuery.isLoading ? (
            <SectionSkeleton rows={4} />
          ) : lowStockProducts.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Aucun produit sous le seuil aujourd'hui.
            </div>
          ) : (
            <ul className="space-y-3">
              {lowStockProducts.slice(0, 5).map((item) => (
                <li key={item.productId} className="flex items-start justify-between gap-3 rounded-[20px] border border-border/70 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.productName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Stock disponible : {formatQty(item.currentQty)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.currentQty <= 0 ? "Rupture" : "Sous le seuil"} · Seuil {formatQty(item.alertThreshold)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/app/catalog/${item.productId}`}>Voir</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to={currentDraftOrder ? `/app/orders/${currentDraftOrder.id}` : "/app/catalog"}>
                        <ShoppingCart className="h-4 w-4" />
                        Commander
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Activite recente" description="Les dernieres operations utiles pour reprendre le fil du service.">
          {receptionsQuery.isLoading || recentInventoriesQuery.isLoading || recentWasteQuery.isLoading ? (
            <SectionSkeleton rows={3} />
          ) : recentActivity.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Aucune activite recente disponible.
            </div>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 rounded-[20px] border border-border/70 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={item.to}>
                      Ouvrir
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </section>
  );
}
