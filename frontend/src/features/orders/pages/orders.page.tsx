import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSuppliersAll } from "@/features/suppliers/api/suppliers.queries";
import { useOrdersStore } from "@/features/orders/orders.store";
import { formatOrderCurrency, formatOrderDate, getOrderEstimatedTotal, getOrderStatusLabel, getOrderStatusTone } from "@/features/orders/orders.utils";
import { ModuleHeroHeader } from "@/shared/ui/module-hero-header";
import { SectionCard } from "@/shared/ui/section-card";

type OrderSection = {
  id: string;
  title: string;
  description: string;
  emptyLabel: string;
  orders: ReturnType<typeof useOrdersStore.getState>["orders"];
};

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

export function OrdersPage() {
  const navigate = useNavigate();
  const orders = useOrdersStore((state) => state.orders);
  const createDraftOrder = useOrdersStore((state) => state.createDraftOrder);
  const suppliersQuery = useSuppliersAll();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
        id: "drafts",
        title: "Brouillons à finaliser",
        description: "Ce que vous êtes en train de préparer avant l'envoi.",
        emptyLabel: "Aucun brouillon pour le moment.",
        orders: draftOrders,
      },
      {
        id: "active",
        title: "Achats en cours",
        description: "Commandes déjà envoyées ou en attente de réception complète.",
        emptyLabel: "Aucune commande en cours.",
        orders: activeOrders,
      },
      {
        id: "received",
        title: "Commandes terminées",
        description: "Achats déjà reçus et reliés au stock réel.",
        emptyLabel: "Aucune commande reçue pour le moment.",
        orders: receivedOrders,
      },
      {
        id: "cancelled",
        title: "Commandes annulées",
        description: "Achats abandonnés ou non poursuivis.",
        emptyLabel: "Aucune commande annulée.",
        orders: cancelledOrders,
      },
    ],
    [activeOrders, cancelledOrders, draftOrders, receivedOrders],
  );

  return (
    <section className="page-shell-wide space-y-6">
      <ModuleHeroHeader
        eyebrow="Achats"
        title="Commandes"
        description="Préparez vos achats et enregistrez les livraisons."
        tone="orders"
        actions={
          <>
            <Button
              onClick={() => {
                const orderId = createDraftOrder();
                navigate(`/app/orders/${orderId}`);
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
          { label: "Brouillons", value: draftOrders.length, help: "À vérifier avant envoi" },
          { label: "En cours", value: activeOrders.length, help: "Achats envoyés ou à recevoir" },
          { label: "Reçues", value: receivedOrders.length, help: "Commandes déjà terminées" },
        ]}
      />

      <SectionCard title="Liste des commandes">
        <div className="grid gap-3 rounded-[22px] border border-border/70 bg-muted/20 p-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Filtrer par date</p>
            <p className="text-sm text-muted-foreground">Affichez seulement les commandes passées sur une période donnée.</p>
          </div>

          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Du</span>
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>

          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">Au</span>
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              disabled={!dateFrom && !dateTo}
              onClick={() => {
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
              onClick={() => {
                const orderId = createDraftOrder();
                navigate(`/app/orders/${orderId}`);
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
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">{section.title}</h2>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>

                {section.orders.length === 0 ? (
                  <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{section.emptyLabel}</p>
                ) : (
                  section.orders.map((order) => {
                    const supplierName = order.supplierId ? supplierNameById[order.supplierId] ?? "À attribuer" : "À attribuer";
                    const estimatedTotal = getOrderEstimatedTotal(order);
                    return (
                      <article key={order.id} className="rounded-[24px] border border-border/70 bg-background/90 p-4">
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

                          <div className="flex flex-wrap items-center gap-2">
                            <div className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-foreground">
                              {estimatedTotal > 0 ? formatOrderCurrency(estimatedTotal) : "Total à estimer"}
                            </div>
                            <Button asChild size="sm">
                              <Link to={`/app/orders/${order.id}`}>Ouvrir</Link>
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-2xl bg-muted/50 p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Produits concernés</p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                              {order.lines.slice(0, 3).map((line) => line.productName).join(", ") || "Aucun produit"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-muted/50 p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Réceptions</p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                              {order.receptionIds.length > 0 ? `${order.receptionIds.length} réception(s) liée(s)` : "Pas encore de réception"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-muted/50 p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">À faire</p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                              {order.status === "DRAFT"
                                ? "Vérifier puis envoyer"
                                : order.status === "SENT"
                                  ? "Attendre la livraison"
                                  : order.status === "PARTIALLY_RECEIVED"
                                    ? "Finir la réception"
                                    : order.status === "CANCELLED"
                                      ? "Annulée"
                                      : "Suivi terminé"}
                            </p>
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
