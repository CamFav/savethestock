import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Minus, PackageCheck, Plus, Save, Send, ShoppingCart, Trash2, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateLot } from "@/features/lots/api/lots.queries";
import { useProductsAll } from "@/features/products/api/products.queries";
import { useCreateReception } from "@/features/receptions/api/receptions.queries";
import { useSuppliersAll } from "@/features/suppliers/api/suppliers.queries";
import { useOrdersStore } from "@/features/orders/orders.store";
import type { OrderLine } from "@/features/orders/orders.types";
import { formatOrderCurrency, getOrderEstimatedTotal, getOrderStatusLabel, getOrderStatusTone } from "@/features/orders/orders.utils";
import type { ApiError } from "@/shared/api/apiClient";
import { DetailBackLink } from "@/shared/ui/detail-back-link";
import { PageHeader } from "@/shared/ui/page-header";
import { SectionCard } from "@/shared/ui/section-card";

type ReceiveLineState = {
  quantity: string;
  lotCode: string;
  expiryDate: string;
  unitCost: string;
};

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 400) return error.message ?? "Requête invalide.";
  if (error.status === 401) return "Votre session a expiré.";
  if (error.status === 404) return "Élément introuvable.";
  return error.message ?? fallback;
}

function getEmptyReceiveLine(): ReceiveLineState {
  return {
    quantity: "",
    lotCode: "",
    expiryDate: "",
    unitCost: "",
  };
}

export function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const orderId = params.orderId ?? "";

  const orders = useOrdersStore((state) => state.orders);
  const updateOrderMeta = useOrdersStore((state) => state.updateOrderMeta);
  const updateOrderLine = useOrdersStore((state) => state.updateOrderLine);
  const addLineToOrder = useOrdersStore((state) => state.addLineToOrder);
  const removeOrderLine = useOrdersStore((state) => state.removeOrderLine);
  const deleteOrder = useOrdersStore((state) => state.deleteOrder);
  const markOrderAsSent = useOrdersStore((state) => state.markOrderAsSent);
  const cancelOrder = useOrdersStore((state) => state.cancelOrder);
  const recordOrderReception = useOrdersStore((state) => state.recordOrderReception);

  const productsQuery = useProductsAll();
  const suppliersQuery = useSuppliersAll();
  const createReceptionMutation = useCreateReception();
  const createLotMutation = useCreateLot();

  const [newProductId, setNewProductId] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryNote, setDeliveryNote] = useState("");
  const [receiveByLineId, setReceiveByLineId] = useState<Record<string, ReceiveLineState>>({});

  const order = useMemo(() => orders.find((item) => item.id === orderId) ?? null, [orderId, orders]);
  const products = productsQuery.data?.items ?? [];
  const suppliers = suppliersQuery.data?.items ?? [];

  const availableProducts = useMemo(() => products.filter((product) => !order?.lines.some((line) => line.productId === product.id)), [order?.lines, products]);

  const orderTotals = useMemo(() => {
    if (!order) {
      return { ordered: 0, received: 0, remaining: 0 };
    }

    const ordered = order.lines.reduce((sum, line) => sum + line.quantityOrdered, 0);
    const received = order.lines.reduce((sum, line) => sum + line.quantityReceived, 0);
    return {
      ordered,
      received,
      remaining: Math.max(ordered - received, 0),
    };
  }, [order]);

  function getReceiveLine(line: OrderLine): ReceiveLineState {
    return receiveByLineId[line.id] ?? getEmptyReceiveLine();
  }

  function updateReceiveLine(lineId: string, patch: Partial<ReceiveLineState>) {
    setReceiveByLineId((current) => ({
      ...current,
      [lineId]: {
        ...(current[lineId] ?? getEmptyReceiveLine()),
        ...patch,
      },
    }));
  }

  if (!order) {
    return (
      <section className="page-shell">
        <SectionCard title="Commande introuvable" description="Cette commande n'est plus disponible.">
          <Button asChild>
            <Link to="/app/orders">Retour aux commandes</Link>
          </Button>
        </SectionCard>
      </section>
    );
  }

  const currentOrder = order;
  const estimatedTotal = getOrderEstimatedTotal(currentOrder);
  const isDraft = currentOrder.status === "DRAFT";
  const isSent = currentOrder.status === "SENT";
  const isPartiallyReceived = currentOrder.status === "PARTIALLY_RECEIVED";
  const isReceived = currentOrder.status === "RECEIVED";
  const isCancelled = currentOrder.status === "CANCELLED";
  const canEditOrder = isDraft;
  const canMarkAsSent = isDraft;
  const canCancel = isSent;
  const canDelete = isDraft;
  const canReceive = (isSent || isPartiallyReceived) && orderTotals.remaining > 0;

  const statusMessage = isReceived
    ? "Commande terminée. Les quantités reçues sont enregistrées et la commande est maintenant en lecture seule."
    : isCancelled
      ? "Commande annulée. Elle reste consultable, mais ne peut plus être modifiée."
      : isPartiallyReceived
        ? "Livraison en cours. La commande est verrouillée et seules les réceptions restantes peuvent être enregistrées."
        : isSent
          ? "Commande envoyée. Vérifiez les livraisons reçues depuis la section dédiée."
          : "Brouillon modifiable avant envoi.";

  function handleSaveOrder() {
      toast.success("Commande enregistrée.");
  }

  function handleMarkAsSent() {
    markOrderAsSent(currentOrder.id);
    toast.success("Commande marquée comme envoyée.");
  }

  function handleCancelOrder() {
    cancelOrder(currentOrder.id);
    toast.success("Commande annulée.");
  }

  async function handleReceiveOrder() {
    if (!currentOrder.supplierId) {
      toast.error("Choisissez d'abord un fournisseur avant d'enregistrer la livraison.");
      return;
    }

    const linesToReceive = currentOrder.lines
      .map((line) => {
        const state = getReceiveLine(line);
        const quantity = Number(state.quantity);
        const remaining = Math.max(line.quantityOrdered - line.quantityReceived, 0);

        return {
          line,
          state,
          quantity: Number.isFinite(quantity) ? quantity : 0,
          remaining,
        };
      })
      .filter((item) => item.quantity > 0);

    if (linesToReceive.length === 0) {
      toast.error("Renseignez au moins une quantité reçue.");
      return;
    }

    const invalidLine = linesToReceive.find((item) => item.quantity > item.remaining);
    if (invalidLine) {
      toast.error(`La quantité reçue pour ${invalidLine.line.productName} dépasse le reste à recevoir.`);
      return;
    }

      try {
      const createdReception = await createReceptionMutation.mutateAsync({
        supplierId: currentOrder.supplierId,
        receptionDate: deliveryDate,
        reference: `${currentOrder.reference} · livraison`,
        notes: deliveryNote || `Livraison enregistrée depuis la commande ${currentOrder.reference}`,
      });

      for (const item of linesToReceive) {
        await createLotMutation.mutateAsync({
          productId: item.line.productId,
          quantityInitial: item.quantity,
          receptionId: createdReception.id,
          lotCode: item.state.lotCode || undefined,
          expiryDate: item.state.expiryDate || undefined,
          unitCost: item.state.unitCost === "" ? (item.line.unitPrice ?? undefined) : Number(item.state.unitCost),
        });
      }

      recordOrderReception(currentOrder.id, {
        receptionId: createdReception.id,
        receivedByProductId: Object.fromEntries(linesToReceive.map((item) => [item.line.productId, item.quantity])),
      });

      setReceiveByLineId({});
      setDeliveryNote("");
      toast.success("Livraison enregistrée. Les lots ont été créés et le stock réel est mis à jour.", {
        action: {
          label: "Ouvrir",
          onClick: () => navigate(`/app/receptions/${createdReception.id}`),
        },
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error as ApiError, "Impossible d'enregistrer la livraison."));
    }
  }

  return (
    <section className="page-shell-wide space-y-6">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span>{order.reference}</span>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getOrderStatusTone(order.status)}`}>
              {getOrderStatusLabel(order.status)}
            </span>
          </span>
        }
        description="Préparez l'achat, suivez ce qui reste à recevoir et enregistrez la livraison directement depuis cette commande."
        actions={
          <>
            <DetailBackLink to="/app/orders" label="Retour aux commandes" />
            <Button
              variant="outline"
              onClick={() => document.getElementById("order-receive-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              disabled={!canReceive}
            >
              <Truck className="h-4 w-4" />
              Recevoir la commande
            </Button>
          </>
        }
      />

      <SectionCard
        title="État de la commande"
        description={statusMessage}
        actions={
          <div className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-medium ${getOrderStatusTone(order.status)}`}>
            {getOrderStatusLabel(order.status)}
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[20px] border border-border/70 bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Commande</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">{orderTotals.ordered}</p>
          </div>
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Déjà reçu</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-emerald-900">{orderTotals.received}</p>
          </div>
          <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-amber-700">Reste à recevoir</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-amber-900">{orderTotals.remaining}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Livraisons liées"
        description={
          order.receptionIds.length > 0
            ? `${order.receptionIds.length} livraison(s) déjà enregistrée(s) pour cette commande.`
            : canReceive
              ? "Aucune livraison enregistrée pour le moment. Utilisez la section de réception pour enregistrer ce qui arrive réellement."
              : "Aucune livraison enregistrée pour le moment."
        }
      >
        {order.receptionIds.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {order.receptionIds.map((receptionId, index) => (
              <div key={receptionId} className="rounded-[20px] border border-border/70 bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Livraison {index + 1}</p>
                <p className="mt-2 text-sm font-medium text-foreground">{receptionId}</p>
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link to={`/app/receptions/${receptionId}`}>Ouvrir la livraison</Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {canReceive
              ? "La commande a été envoyée, mais aucune livraison n'a encore été enregistrée."
              : "Aucune livraison associée à cette commande."}
          </p>
        )}
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Informations de commande" description="Renseignez le fournisseur, la date et les informations utiles pour cette commande.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm font-medium text-foreground">Fournisseur</span>
              <select
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                value={order.supplierId ?? ""}
                disabled={!canEditOrder}
                onChange={(event) => updateOrderMeta(order.id, { supplierId: event.target.value || undefined })}
              >
                <option value="">À attribuer</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-medium text-foreground">Date</span>
              <Input value={order.orderDate} type="date" disabled={!canEditOrder} onChange={(event) => updateOrderMeta(order.id, { orderDate: event.target.value })} />
            </label>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="block text-sm font-medium text-foreground">Note</span>
            <textarea
              className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm"
              value={order.notes ?? ""}
              disabled={!canEditOrder}
              onChange={(event) => updateOrderMeta(order.id, { notes: event.target.value })}
              placeholder="Ex. livraison du jeudi, produit sensible, quantité à confirmer..."
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            {canEditOrder ? (
              <Button onClick={handleSaveOrder}>
                <Save className="h-4 w-4" />
                Enregistrer
              </Button>
            ) : null}
            {canMarkAsSent ? (
              <Button variant="outline" onClick={handleMarkAsSent}>
                <Send className="h-4 w-4" />
                Marquer comme envoyée
              </Button>
            ) : null}
            {canCancel ? (
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleCancelOrder}>
                <XCircle className="h-4 w-4" />
                Annuler la commande
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  deleteOrder(order.id);
                  navigate("/app/orders");
                }}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer la commande
              </Button>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title="Actions disponibles"
          description={
            canEditOrder
              ? "Complétez le brouillon avant l'envoi."
              : canReceive
                ? "La structure de commande est verrouillée. Enregistrez seulement les livraisons restantes."
                : "Cette commande est consultable, sans action de modification."
          }
        >
          <div className="grid gap-3">
            <div className="rounded-[20px] border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ce que vous pouvez faire ici</p>
              <p className="mt-2 text-sm text-foreground">
                {canEditOrder
                  ? "Modifier le fournisseur, la date, les notes, les produits et les quantités."
                  : canReceive
                    ? "Consulter la commande et enregistrer les livraisons restantes."
                    : "Consulter l'historique, les produits commandés et les livraisons déjà liées."}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Produits commandés"
        description="Ajustez les quantités prévues et les prix, puis passez à la livraison."
        actions={
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total estimé</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{estimatedTotal > 0 ? formatOrderCurrency(estimatedTotal) : "À estimer"}</p>
          </div>
        }
      >
        {order.lines.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center">
            <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">Aucun produit pour le moment</p>
            <p className="mt-1 text-sm text-muted-foreground">Ajoutez des produits depuis le catalogue ou directement ci-dessous.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {order.lines.map((line) => {
              const remaining = Math.max(line.quantityOrdered - line.quantityReceived, 0);
              return (
                <article key={line.id} className="rounded-[20px] border border-border/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Button asChild variant="link" className="h-auto px-0 py-0 text-left text-base font-medium text-foreground">
                        <Link to={`/app/catalog/${line.productId}`}>{line.productName}</Link>
                      </Button>
                      <p className="text-xs text-muted-foreground">{line.unit}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/app/catalog/${line.productId}`}>Voir le produit</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/app/catalog?view=lots&productId=${line.productId}`}>Voir les lots</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[170px_160px_1fr_160px_auto] md:items-end">
                    <div className="space-y-2">
                      <span className="block text-sm font-medium text-foreground">Quantité commandée</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={!canEditOrder}
                          onClick={() => updateOrderLine(order.id, line.id, { quantityOrdered: Math.max(line.quantityOrdered - 1, 1) })}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          value={line.quantityOrdered}
                          disabled={!canEditOrder}
                          onChange={(event) => updateOrderLine(order.id, line.id, { quantityOrdered: Number(event.target.value) || 1 })}
                        />
                        <Button size="icon" variant="outline" disabled={!canEditOrder} onClick={() => updateOrderLine(order.id, line.id, { quantityOrdered: line.quantityOrdered + 1 })}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <label className="space-y-2">
                      <span className="block text-sm font-medium text-foreground">Prix unitaire</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.unitPrice ?? ""}
                        disabled={!canEditOrder}
                        onChange={(event) =>
                          updateOrderLine(order.id, line.id, {
                            unitPrice: event.target.value === "" ? null : Number(event.target.value),
                          })
                        }
                        placeholder="Non renseigné"
                      />
                    </label>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[18px] bg-muted/40 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Commande</p>
                        <p className="mt-1 text-base font-semibold text-foreground">{line.quantityOrdered}</p>
                      </div>
                      <div className="rounded-[18px] bg-emerald-50 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Reçu</p>
                        <p className="mt-1 text-base font-semibold text-emerald-900">{line.quantityReceived}</p>
                      </div>
                      <div className="rounded-[18px] bg-amber-50 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-amber-700">Reste</p>
                        <p className="mt-1 text-base font-semibold text-amber-900">{remaining}</p>
                      </div>
                    </div>

                    <div className="rounded-[18px] bg-muted/40 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total estimé</p>
                      <p className="mt-2 text-base font-semibold text-foreground">
                        {line.unitPrice === null ? "À estimer" : formatOrderCurrency(line.unitPrice * line.quantityOrdered)}
                      </p>
                    </div>

                    {canEditOrder ? (
                      <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeOrderLine(order.id, line.id)}>
                        <XCircle className="h-4 w-4" />
                        Retirer
                      </Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-5 rounded-[22px] border border-border/70 bg-muted/20 p-4">
          <p className="text-sm font-medium text-foreground">Ajouter un produit</p>
          <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_auto]">
            <select
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
              value={newProductId}
              disabled={!canEditOrder}
              onChange={(event) => setNewProductId(event.target.value)}
            >
              <option value="">Choisir un produit</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <Input value={newQuantity} type="number" min={1} disabled={!canEditOrder} onChange={(event) => setNewQuantity(event.target.value)} />
            <Button
              onClick={() => {
                const selectedProduct = products.find((product) => product.id === newProductId);
                if (!selectedProduct) return;
                addLineToOrder(order.id, {
                  productId: selectedProduct.id,
                  productName: selectedProduct.name,
                  unit: selectedProduct.unit,
                  quantity: Number(newQuantity) || 1,
                  unitPrice: null,
                });
                setNewProductId("");
                setNewQuantity("1");
              }}
              disabled={!canEditOrder || !newProductId}
            >
              Ajouter à la commande
            </Button>
          </div>
          {!canEditOrder ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Les produits et quantités ne peuvent plus être modifiés après l'envoi de la commande.
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="Recevoir la commande"
        description="Enregistrez ici ce qui a réellement été livré. Chaque quantité reçue crée un lot et met à jour le stock réel."
      >
        <div id="order-receive-section" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <label className="space-y-2">
              <span className="block text-sm font-medium text-foreground">Date de livraison</span>
              <Input type="date" value={deliveryDate} disabled={!canReceive} onChange={(event) => setDeliveryDate(event.target.value)} />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-medium text-foreground">Note de livraison</span>
              <Input value={deliveryNote} disabled={!canReceive} onChange={(event) => setDeliveryNote(event.target.value)} placeholder="Ex. manque 2 caisses, produit sensible..." />
            </label>
          </div>

          {!canReceive ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {isDraft
                ? "Envoyez d'abord la commande avant d'enregistrer une livraison."
                : isReceived
                  ? "Toutes les livraisons ont déjà été enregistrées pour cette commande."
                  : "Aucune livraison supplémentaire ne peut être enregistrée sur cette commande."}
            </p>
          ) : order.lines.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Ajoutez d'abord des produits à la commande avant d'enregistrer la livraison.
            </p>
          ) : (
            <div className="space-y-3">
              {order.lines.map((line) => {
                const receiveState = getReceiveLine(line);
                const remaining = Math.max(line.quantityOrdered - line.quantityReceived, 0);

                return (
                  <article key={`receive-${line.id}`} className="rounded-[20px] border border-border/70 p-4">
                    <div className="grid gap-4 xl:grid-cols-[1.1fr_1.4fr]">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{line.productName}</p>
                          <p className="text-xs text-muted-foreground">{line.unit}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-[16px] bg-muted/40 p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Commande</p>
                            <p className="mt-1 text-base font-semibold text-foreground">{line.quantityOrdered}</p>
                          </div>
                          <div className="rounded-[16px] bg-emerald-50 p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Déjà reçu</p>
                            <p className="mt-1 text-base font-semibold text-emerald-900">{line.quantityReceived}</p>
                          </div>
                          <div className="rounded-[16px] bg-amber-50 p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-amber-700">Reste à recevoir</p>
                            <p className="mt-1 text-base font-semibold text-amber-900">{remaining}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <label className="space-y-2">
                          <span className="block text-sm font-medium text-foreground">Produits reçus</span>
                          <Input
                            type="number"
                            min={0}
                            max={remaining}
                            value={receiveState.quantity}
                            disabled={!canReceive}
                            onChange={(event) => updateReceiveLine(line.id, { quantity: event.target.value })}
                            placeholder={remaining > 0 ? String(remaining) : "0"}
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="block text-sm font-medium text-foreground">Code lot</span>
                          <Input
                            value={receiveState.lotCode}
                            disabled={!canReceive}
                            onChange={(event) => updateReceiveLine(line.id, { lotCode: event.target.value })}
                            placeholder="Facultatif"
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="block text-sm font-medium text-foreground">Date limite</span>
                          <Input
                            type="date"
                            value={receiveState.expiryDate}
                            disabled={!canReceive}
                            onChange={(event) => updateReceiveLine(line.id, { expiryDate: event.target.value })}
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="block text-sm font-medium text-foreground">Prix unitaire</span>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={receiveState.unitCost}
                            disabled={!canReceive}
                            onChange={(event) => updateReceiveLine(line.id, { unitCost: event.target.value })}
                            placeholder={line.unitPrice === null ? "Facultatif" : String(line.unitPrice)}
                          />
                        </label>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => void handleReceiveOrder()}
              disabled={!canReceive || createReceptionMutation.isPending || createLotMutation.isPending || order.lines.length === 0}
            >
              <PackageCheck className="h-4 w-4" />
              {createReceptionMutation.isPending || createLotMutation.isPending ? "Enregistrement..." : "Enregistrer la réception"}
            </Button>
            <p className="text-sm text-muted-foreground">
              La livraison crée une réception interne, génère les lots puis met à jour le stock réel.
            </p>
          </div>
        </div>
      </SectionCard>
    </section>
  );
}
