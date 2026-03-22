import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Clock3, PackageCheck, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateDraftOrder, useOrdersAll } from "@/features/orders/api/orders.queries";
import { useSuppliersAll } from "@/features/suppliers/api/suppliers.queries";
import type { OrderRecord } from "@/features/orders/orders.types";
import { formatOrderCurrency, formatOrderDate, getOrderEstimatedTotal, getOrderStatusLabel, getOrderStatusTone } from "@/features/orders/orders.utils";
import { ModuleHeroHeader } from "@/shared/ui/module-hero-header";
import { SectionCard } from "@/shared/ui/section-card";

type OrderSection = {
  id: string;
  title: string;
  description: string;
  emptyLabel: string;
  orders: OrderRecord[];
  tone: "active" | "history";
};

type PeriodPreset = "7d" | "14d" | "thisMonth" | "lastMonth" | "custom";

function toDayTimestamp(value?: string): number | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function formatQuantity(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(safe);
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getPresetRange(preset: Exclude<PeriodPreset, "custom">): { from: string; to: string } {
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (preset === "7d") {
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 6);
    return { from: toIsoDate(start), to: toIsoDate(end) };
  }

  if (preset === "14d") {
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 13);
    return { from: toIsoDate(start), to: toIsoDate(end) };
  }

  if (preset === "thisMonth") {
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    return { from: toIsoDate(start), to: toIsoDate(end) };
  }

  const startLastMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1));
  const endLastMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0));
  return { from: toIsoDate(startLastMonth), to: toIsoDate(endLastMonth) };
}

export function OrdersPage() {
  const navigate = useNavigate();
  const ordersQuery = useOrdersAll();
  const createDraftOrderMutation = useCreateDraftOrder();
  const suppliersQuery = useSuppliersAll();
  const initialRange = useMemo(() => getPresetRange("14d"), []);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("14d");
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);

  const orders = useMemo(() => ordersQuery.data?.items ?? [], [ordersQuery.data?.items]);

  const supplierNameById = useMemo(() => {
    return (suppliersQuery.data?.items ?? []).reduce<Record<string, string>>((acc, supplier) => {
      acc[supplier.id] = supplier.name;
      return acc;
    }, {});
  }, [suppliersQuery.data?.items]);

  const filteredOrders = useMemo(() => {
    const fromTs = toDayTimestamp(dateFrom);
    const toTs = toDayTimestamp(dateTo);

    return orders.filter((order) => {
      const orderTs = toDayTimestamp(order.orderDate);
      if (orderTs === null) {
        return !fromTs && !toTs;
      }

      if (fromTs !== null && orderTs < fromTs) {
        return false;
      }

      if (toTs !== null && orderTs > toTs) {
        return false;
      }

      return true;
    });
  }, [dateFrom, dateTo, orders]);

  const draftOrders = useMemo(() => filteredOrders.filter((order) => order.status === "DRAFT"), [filteredOrders]);
  const activeOrders = useMemo(() => filteredOrders.filter((order) => order.status === "SENT" || order.status === "PARTIALLY_RECEIVED"), [filteredOrders]);
  const receivedOrders = useMemo(() => filteredOrders.filter((order) => order.status === "RECEIVED"), [filteredOrders]);
  const cancelledOrders = useMemo(() => filteredOrders.filter((order) => order.status === "CANCELLED"), [filteredOrders]);

  const orderSections = useMemo<OrderSection[]>(
    () => [
      {
        id: "action",
        title: "À traiter",
        description: "Brouillons à finaliser, commandes envoyées et réceptions encore incomplètes.",
        emptyLabel: "Aucune commande en attente d'action.",
        orders: [...draftOrders, ...activeOrders],
        tone: "active",
      },
      {
        id: "history",
        title: "Historique",
        description: "Commandes terminées ou abandonnées, pour garder une trace claire des achats passés.",
        emptyLabel: "Aucun historique de commande pour le moment.",
        orders: [...receivedOrders, ...cancelledOrders],
        tone: "history",
      },
    ],
    [activeOrders, cancelledOrders, draftOrders, receivedOrders],
  );

  function applyPreset(nextPreset: Exclude<PeriodPreset, "custom">) {
    const range = getPresetRange(nextPreset);
    setPeriodPreset(nextPreset);
    setDateFrom(range.from);
    setDateTo(range.to);
  }

  function onFromChange(value: string) {
    setPeriodPreset("custom");
    setDateFrom(value);
  }

  function onToChange(value: string) {
    setPeriodPreset("custom");
    setDateTo(value);
  }

  return (
    <section className="page-shell-wide space-y-6">
      <ModuleHeroHeader
        eyebrow="Achats"
        title="Commandes"
        description="Préparez vos achats, suivez ce qui reste à recevoir et retrouvez rapidement les commandes qui demandent encore une action."
        tone="orders"
        actions={
          <>
            <Button
              onClick={async () => {
                const order = await createDraftOrderMutation.mutateAsync();
                navigate(`/app/orders/${order.id}`);
              }}
            >
              <Plus className="h-4 w-4" />
              Nouvelle commande
            </Button>
            <Button asChild variant="outline">
              <Link to="/app/catalog">Retour au catalogue</Link>
            </Button>
          </>
        }
        stats={[
          { label: "Brouillons", value: draftOrders.length, help: "À finaliser avant l'envoi" },
          { label: "En cours", value: activeOrders.length, help: "Commandes envoyées ou partiellement reçues" },
          { label: "Terminées", value: receivedOrders.length, help: "Achats entièrement reçus" },
        ]}
      />

      <SectionCard title="Liste des commandes">
        <div className="grid gap-3 rounded-[24px] border border-border/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.03),rgba(15,23,42,0.01))] p-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Filtrer par date</p>
            <p className="text-sm text-muted-foreground">Isolez une période pour vous concentrer sur les achats à suivre ou l'historique récent.</p>
          </div>

          <div className="flex flex-wrap gap-2 md:col-span-3 md:justify-end">
            <Button size="sm" variant={periodPreset === "7d" ? "default" : "outline"} onClick={() => applyPreset("7d")}>
              7 jours
            </Button>
            <Button size="sm" variant={periodPreset === "14d" ? "default" : "outline"} onClick={() => applyPreset("14d")}>
              14 jours
            </Button>
            <Button size="sm" variant={periodPreset === "thisMonth" ? "default" : "outline"} onClick={() => applyPreset("thisMonth")}>
              Ce mois-ci
            </Button>
            <Button size="sm" variant={periodPreset === "lastMonth" ? "default" : "outline"} onClick={() => applyPreset("lastMonth")}>
              Le mois dernier
            </Button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 rounded-[24px] border border-border/70 bg-background/70 p-4 md:grid-cols-[180px_180px_auto]">
          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Du</span>
            <Input type="date" value={dateFrom} onChange={(event) => onFromChange(event.target.value)} />
          </label>

          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Au</span>
            <Input type="date" value={dateTo} onChange={(event) => onToChange(event.target.value)} />
          </label>

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              disabled={!dateFrom && !dateTo}
              onClick={() => {
                setPeriodPreset("custom");
                setDateFrom("");
                setDateTo("");
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">Aucune commande pour le moment</p>
            <p className="mt-1 text-sm text-muted-foreground">Ajoutez des produits depuis le catalogue ou créez directement une commande.</p>
            <Button
              className="mt-4"
              onClick={async () => {
                const order = await createDraftOrderMutation.mutateAsync();
                navigate(`/app/orders/${order.id}`);
              }}
            >
              Créer une commande
            </Button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">Aucune commande sur cette période</p>
            <p className="mt-1 text-sm text-muted-foreground">Élargissez la période ou réinitialisez le filtre pour revoir toutes les commandes.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orderSections.map((section) => (
              <div key={section.id} className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                          section.tone === "active"
                            ? "border-sky-200 bg-sky-50 text-sky-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {section.tone === "active" ? <Clock3 className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
                      </div>
                      <h2 className="text-lg font-semibold tracking-tight text-foreground">{section.title}</h2>
                      <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {section.orders.length}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>

                {section.orders.length === 0 ? (
                  <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{section.emptyLabel}</p>
                ) : (
                  section.orders.map((order) => {
                    const supplierName = order.supplierId ? supplierNameById[order.supplierId] ?? "À attribuer" : "À attribuer";
                    const estimatedTotal = getOrderEstimatedTotal(order);
                    const orderedQuantity = order.lines.reduce((sum, line) => sum + line.quantityOrdered, 0);
                    const receivedQuantity = order.lines.reduce((sum, line) => sum + line.quantityReceived, 0);
                    const remainingQuantity = Math.max(orderedQuantity - receivedQuantity, 0);
                    const progress = orderedQuantity > 0 ? Math.min(100, Math.round((receivedQuantity / orderedQuantity) * 100)) : 0;
                    const nextStep =
                      order.status === "DRAFT"
                        ? "Compléter puis envoyer la commande"
                        : order.status === "SENT"
                          ? "Attendre ou enregistrer la première livraison"
                          : order.status === "PARTIALLY_RECEIVED"
                            ? "Terminer la réception restante"
                            : order.status === "CANCELLED"
                              ? "Commande clôturée sans suite"
                              : "Commande terminée";

                    return (
                      <article
                        key={order.id}
                        className={`rounded-[26px] border p-5 transition-colors ${
                          section.tone === "active"
                            ? "border-slate-200 bg-[linear-gradient(160deg,rgba(241,245,249,0.96),rgba(255,255,255,0.98))]"
                            : "border-border/70 bg-[linear-gradient(160deg,rgba(248,250,252,0.96),rgba(255,255,255,0.98))]"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-semibold tracking-[-0.03em] text-foreground">{order.reference}</span>
                              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getOrderStatusTone(order.status)}`}>
                                {getOrderStatusLabel(order.status)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span>Fournisseur : {supplierName}</span>
                              <span>Date : {formatOrderDate(order.orderDate)}</span>
                              <span>Articles : {order.lines.length}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-start gap-2 sm:items-end">
                            <div className="rounded-full bg-background/80 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm">
                              {estimatedTotal > 0 ? formatOrderCurrency(estimatedTotal) : "Total à estimer"}
                            </div>
                            <Button asChild size="sm" className="gap-1.5">
                              <Link to={`/app/orders/${order.id}`}>
                                {section.tone === "active" ? "Ouvrir et traiter" : "Ouvrir"}
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
                          <div className="space-y-4 rounded-[22px] border border-border/60 bg-background/70 p-4">
                            <div className="flex items-end justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Avancement réception</p>
                                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">{progress}%</p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatQuantity(receivedQuantity)} reçus / {formatQuantity(orderedQuantity)} commandés
                              </p>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  order.status === "RECEIVED"
                                    ? "bg-emerald-500"
                                    : order.status === "PARTIALLY_RECEIVED"
                                      ? "bg-amber-500"
                                      : order.status === "SENT"
                                        ? "bg-sky-500"
                                        : order.status === "CANCELLED"
                                          ? "bg-slate-400"
                                          : "bg-slate-700"
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-2xl bg-muted/40 p-3">
                                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Commandé</p>
                                <p className="mt-1 text-base font-semibold text-foreground">{formatQuantity(orderedQuantity)}</p>
                              </div>
                              <div className="rounded-2xl bg-emerald-50 p-3">
                                <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Reçu</p>
                                <p className="mt-1 text-base font-semibold text-emerald-900">{formatQuantity(receivedQuantity)}</p>
                              </div>
                              <div className="rounded-2xl bg-sky-50 p-3">
                                <p className="text-xs uppercase tracking-[0.18em] text-sky-700">Reste</p>
                                <p className="mt-1 text-base font-semibold text-sky-900">{formatQuantity(remainingQuantity)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-3">
                            <div className="rounded-[22px] border border-border/60 bg-background/70 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Produits concernés</p>
                              <p className="mt-2 text-sm font-medium leading-6 text-foreground">
                                {order.lines.slice(0, 3).map((line) => line.productName).join(", ") || "Aucun produit"}
                                {order.lines.length > 3 ? ` +${order.lines.length - 3}` : ""}
                              </p>
                            </div>
                            <div className="rounded-[22px] border border-border/60 bg-background/70 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Livraisons liées</p>
                              <p className="mt-2 text-sm font-medium text-foreground">
                                {order.receptionIds.length > 0 ? `${order.receptionIds.length} réception(s) liée(s)` : "Pas encore de réception"}
                              </p>
                            </div>
                            <div className="rounded-[22px] border border-border/60 bg-background/70 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Prochaine étape</p>
                              <p className="mt-2 text-sm font-medium text-foreground">{nextStep}</p>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </section>
  );
}
