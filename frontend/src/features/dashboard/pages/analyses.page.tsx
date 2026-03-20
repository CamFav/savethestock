import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, Boxes, ShieldAlert, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoriesList } from "@/features/categories/api/categories.queries";
import {
  useDashboardAlerts,
  useDashboardSummary,
  useDashboardTopWasteProducts,
} from "@/features/dashboard/api/dashboard.queries";
import { buildAnalysisInsights } from "@/features/dashboard/dashboard-finance.utils";
import { useInventoriesList } from "@/features/inventories/api/inventories.queries";
import { useLotsList } from "@/features/lots/api/lots.queries";
import { useProductsAll } from "@/features/products/api/products.queries";
import { useReceptionsList } from "@/features/receptions/api/receptions.queries";
import { useSuppliersAll } from "@/features/suppliers/api/suppliers.queries";
import { useWasteSessionsList } from "@/features/waste-sessions/api/wasteSessions.queries";
import { ModuleHeroHeader } from "@/shared/ui/module-hero-header";
import type { ApiError } from "@/shared/api/apiClient";
import { MetricValue } from "@/shared/ui/metric-value";

type PeriodPreset = "7d" | "14d" | "thisMonth" | "lastMonth" | "custom";

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

function getApiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 400) return error.message ?? "Requête invalide.";
  if (error.status === 401) return "Votre session a expiré.";
  if (error.status === 404) return "Ressource introuvable.";
  return error.message ?? fallback;
}

function formatCurrency(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(safe);
}

function formatQuantity(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(safe);
}

function KpiCard({
  title,
  value,
  description,
  to,
  placeholder = false,
}: {
  title: string;
  value: string;
  description: string;
  to?: string;
  placeholder?: boolean;
}) {
  return (
    <Card className="border-border/70 bg-background/75">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs uppercase tracking-[0.16em]">{title}</CardDescription>
        <MetricValue placeholder={placeholder}>{value}</MetricValue>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 pt-0">
        <p className="text-xs text-muted-foreground">{description}</p>
        {to ? (
          <Button asChild size="sm" variant="ghost">
            <Link to={to}>
              Voir
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function KpiSkeletonCard() {
  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-2 pb-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-40" />
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function EmptyCardMessage({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">{children}</div>;
}

function BreakdownCard({
  title,
  description,
  rows,
  valueFormatter,
  detailFormatter,
  emptyMessage,
}: {
  title: string;
  description: string;
  rows: Array<{ id: string; label: string; value: number; quantity?: number; count?: number }>;
  valueFormatter: (value: number) => string;
  detailFormatter?: (row: { id: string; label: string; value: number; quantity?: number; count?: number }) => string;
  emptyMessage: string;
}) {
  const topRows = rows.slice(0, 5);
  const maxValue = topRows[0]?.value ?? 0;

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {topRows.length === 0 ? (
          <EmptyCardMessage>{emptyMessage}</EmptyCardMessage>
        ) : (
          <div className="space-y-3">
            {topRows.map((row) => (
              <div key={row.id} className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.label}</p>
                    {detailFormatter ? <p className="text-xs text-muted-foreground">{detailFormatter(row)}</p> : null}
                  </div>
                  <p className="text-sm font-semibold">{valueFormatter(row.value)}</p>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-slate-900/75"
                    style={{ width: maxValue > 0 ? `${Math.max(8, (row.value / maxValue) * 100)}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProductValueCard({
  title,
  description,
  rows,
  valueKey,
  quantityKey,
  emptyMessage,
  tone = "default",
}: {
  title: string;
  description: string;
  rows: Array<{
    productId: string;
    productName: string;
    categoryName: string;
    unit: string;
    availableQuantity: number;
    expiredQuantity: number;
    availableValue: number;
    expiredValue: number;
    minimumStock: number;
    belowThreshold: boolean;
  }>;
  valueKey: "availableValue" | "expiredValue";
  quantityKey: "availableQuantity" | "expiredQuantity";
  emptyMessage: string;
  tone?: "default" | "danger";
}) {
  const topRows = rows.slice(0, 5);

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {topRows.length === 0 ? (
          <EmptyCardMessage>{emptyMessage}</EmptyCardMessage>
        ) : (
          <div className="space-y-3">
            {topRows.map((row) => (
              <Link
                key={row.productId}
                to={`/app/catalog/${row.productId}`}
                className={`block rounded-xl border p-3 transition-colors hover:bg-muted/40 ${tone === "danger" ? "border-red-200/70 bg-red-50/40" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.categoryName} · {formatQuantity(row[quantityKey])} {row.unit}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(row[valueKey])}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertListCard({
  icon,
  title,
  description,
  accentClass,
  rows,
  emptyMessage,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  accentClass: string;
  rows: Array<{ id: string; label: string; help: string; to?: string }>;
  emptyMessage: string;
}) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${accentClass}`}>{icon}</div>
          <div className="space-y-0.5">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyCardMessage>{emptyMessage}</EmptyCardMessage>
        ) : (
          <div className="space-y-2">
            {rows.slice(0, 5).map((row) =>
              row.to ? (
                <Link key={row.id} to={row.to} className="block rounded-xl border p-3 transition-colors hover:bg-muted/40">
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.help}</p>
                </Link>
              ) : (
                <div key={row.id} className="rounded-xl border p-3">
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.help}</p>
                </div>
              ),
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalysesPage() {
  const initialRange = useMemo(() => getPresetRange("14d"), []);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("14d");
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [expiryDays, setExpiryDays] = useState(7);

  const summaryParams = useMemo(() => ({ from: from || undefined, to: to || undefined }), [from, to]);
  const topParams = useMemo(() => ({ from: from || undefined, to: to || undefined, limit: 5 }), [from, to]);
  const alertsParams = useMemo(() => ({ expiryDays }), [expiryDays]);

  const summaryQuery = useDashboardSummary(summaryParams);
  const topQuery = useDashboardTopWasteProducts(topParams);
  const alertsQuery = useDashboardAlerts(alertsParams);

  const lotsQuery = useLotsList({ page: 1, pageSize: 1000 });
  const productsQuery = useProductsAll();
  const categoriesQuery = useCategoriesList({ page: 1, pageSize: 200 });
  const receptionsQuery = useReceptionsList({ page: 1, pageSize: 500 });
  const suppliersQuery = useSuppliersAll();
  const wasteSessionsQuery = useWasteSessionsList({
    page: 1,
    pageSize: 100,
    from: from || undefined,
    to: to || undefined,
    status: "POSTED",
  });
  const inventoriesQuery = useInventoriesList({
    page: 1,
    pageSize: 100,
    from: from || undefined,
    to: to || undefined,
    status: "POSTED",
  });

  useEffect(() => {
    const apiError = summaryQuery.error as ApiError | null;
    if (summaryQuery.isError && apiError) {
      toast.error(getApiErrorMessage(apiError, "Impossible de charger les indicateurs principaux."));
    }
  }, [summaryQuery.error, summaryQuery.isError]);

  useEffect(() => {
    const apiError = lotsQuery.error as ApiError | null;
    if (lotsQuery.isError && apiError) {
      toast.error(getApiErrorMessage(apiError, "Impossible de charger les données stock."));
    }
  }, [lotsQuery.error, lotsQuery.isError]);

  const summary = summaryQuery.data;
  const topWasteProducts = topQuery.data ?? [];
  const alerts = alertsQuery.data;
  const wasteSessionsCount = wasteSessionsQuery.data?.total ?? 0;
  const topWasteProduct = topWasteProducts[0];

  const insights = useMemo(
    () =>
      buildAnalysisInsights({
        lots: lotsQuery.data?.items ?? [],
        products: productsQuery.data?.items ?? [],
        categories: categoriesQuery.data?.items ?? [],
        receptions: receptionsQuery.data?.items ?? [],
        suppliers: suppliersQuery.data?.items ?? [],
        from,
        to,
      }),
    [categoriesQuery.data?.items, from, lotsQuery.data?.items, productsQuery.data?.items, receptionsQuery.data?.items, suppliersQuery.data?.items, to],
  );

  const estimatedPurchasesValue =
    summary?.receptionsValue ??
    insights.purchaseByCategory.reduce((total, category) => total + category.value, 0);

  const heroStats = [
    {
      label: "Achats sur la période",
      value: formatCurrency(estimatedPurchasesValue),
      help: "Réceptions valorisées à partir des lots reçus.",
    },
    {
      label: "Stock utilisable",
      value: formatCurrency(summary?.stockUsableValue ?? 0),
      help: "Valeur mobilisée dans les lots encore vendables.",
    },
    {
      label: "Pertes",
      value: formatCurrency(summary?.wasteValue ?? 0),
      help: "Sessions de pertes validées sur la période choisie.",
    },
    {
      label: "Stock expiré",
      value: formatCurrency(summary?.stockExpiredValue ?? 0),
      help: "Valeur bloquée dans des lots déjà expirés.",
    },
  ];

  const ownerAlerts = [
    ...insights.topExpiredStockProducts.slice(0, 2).map((row) => ({
      id: `expired-${row.productId}`,
      label: row.productName,
      help: `${formatCurrency(row.expiredValue)} bloqués en lots expirés`,
      to: `/app/catalog/${row.productId}`,
    })),
    ...insights.underThresholdProducts.slice(0, 2).map((row) => ({
      id: `threshold-${row.productId}`,
      label: row.productName,
      help: `${formatQuantity(row.availableQuantity)} ${row.unit} disponibles pour un seuil de ${formatQuantity(row.minimumStock)}`,
      to: `/app/catalog/${row.productId}`,
    })),
  ];

  function applyPreset(nextPreset: Exclude<PeriodPreset, "custom">) {
    const range = getPresetRange(nextPreset);
    setPeriodPreset(nextPreset);
    setFrom(range.from);
    setTo(range.to);
  }

  function onFromChange(value: string) {
    setPeriodPreset("custom");
    setFrom(value);
  }

  function onToChange(value: string) {
    setPeriodPreset("custom");
    setTo(value);
  }

  const hasFatalError = summaryQuery.isError && topQuery.isError && alertsQuery.isError;
  if (hasFatalError) {
    return (
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Analyses</h1>
          <p className="text-sm text-muted-foreground">Pilotage financier et opérationnel du stock.</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Impossible de charger les analyses</CardTitle>
            <CardDescription>Impossible de charger les données pour le moment.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() =>
                void Promise.all([
                  summaryQuery.refetch(),
                  topQuery.refetch(),
                  alertsQuery.refetch(),
                  lotsQuery.refetch(),
                ])
              }
            >
              Recharger
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <ModuleHeroHeader
        eyebrow="Analyses"
        title="Pilotez les coûts, le stock et les pertes"
        description="Repérez rapidement où part l’argent, quelle valeur reste immobilisée en stock et où agir en priorité."
        tone="inventories"
        actions={
          <>
            <Button asChild>
              <Link to="/app/catalog">Voir le catalogue</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/app/waste-sessions">Voir les pertes</Link>
            </Button>
          </>
        }
        stats={heroStats}
      />

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Période d’analyse</CardTitle>
          <CardDescription>Choisissez la fenêtre de lecture et le seuil de surveillance des péremptions.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="flex flex-wrap gap-2 lg:col-span-7">
            <Button size="sm" variant={periodPreset === "7d" ? "default" : "outline"} onClick={() => applyPreset("7d")}>
              7 jours
            </Button>
            <Button size="sm" variant={periodPreset === "14d" ? "default" : "outline"} onClick={() => applyPreset("14d")}>
              14 jours
            </Button>
            <Button
              size="sm"
              variant={periodPreset === "thisMonth" ? "default" : "outline"}
              onClick={() => applyPreset("thisMonth")}
            >
              Ce mois
            </Button>
            <Button
              size="sm"
              variant={periodPreset === "lastMonth" ? "default" : "outline"}
              onClick={() => applyPreset("lastMonth")}
            >
              Mois dernier
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-5">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Du</p>
              <Input type="date" value={from} onChange={(event) => onFromChange(event.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Au</p>
              <Input type="date" value={to} onChange={(event) => onToChange(event.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Alerte péremption</p>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={expiryDays}
                onChange={(event) => setExpiryDays(Number(event.target.value))}
              >
                <option value={3}>3 jours</option>
                <option value={7}>7 jours</option>
                <option value={14}>14 jours</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <SectionHeader
          title="Vue d’ensemble financière"
          description="Les montants clés à surveiller pour piloter les achats, le stock et les écarts."
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {summaryQuery.isLoading ? (
            <>
              <KpiSkeletonCard />
              <KpiSkeletonCard />
              <KpiSkeletonCard />
              <KpiSkeletonCard />
              <KpiSkeletonCard />
            </>
          ) : (
            <>
              <KpiCard
                title="Achats totaux"
                value={formatCurrency(estimatedPurchasesValue)}
                description="Réceptions valorisées sur la période."
                to="/app/orders"
              />
              <KpiCard
                title="Stock utilisable"
                value={formatCurrency(summary?.stockUsableValue ?? 0)}
                description="Valeur du stock encore exploitable."
                to="/app/catalog"
              />
              <KpiCard
                title="Stock expiré"
                value={formatCurrency(summary?.stockExpiredValue ?? 0)}
                description="Valeur encore présente dans des lots expirés."
                to="/app/catalog"
              />
              <KpiCard
                title="Pertes"
                value={formatCurrency(summary?.wasteValue ?? 0)}
                description={`${formatQuantity(summary?.wasteQty ?? 0)} unités perdues sur la période.`}
                to={`/app/waste-sessions?from=${from}&to=${to}&status=POSTED`}
              />
              <KpiCard
                title="Écarts d’inventaire"
                value={formatCurrency(summary?.inventoryVarianceValue ?? 0)}
                description="Valorisation fournie par les inventaires validés."
                to="/app/inventories"
              />
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Achats"
          description="Où part l’argent sur la période, par catégorie, fournisseur et produit."
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <BreakdownCard
            title="Achats par catégorie"
            description="Valeur estimée des lots reçus, regroupée par catégorie produit."
            rows={insights.purchaseByCategory}
            valueFormatter={formatCurrency}
            detailFormatter={(row) =>
              `${formatQuantity(row.quantity ?? 0)} unités reçues · ${row.count ?? 0} lots`
            }
            emptyMessage="Aucune réception valorisée sur la période."
          />
          <BreakdownCard
            title="Achats par fournisseur"
            description="Valeur estimée regroupée par fournisseur de réception."
            rows={insights.purchaseBySupplier}
            valueFormatter={formatCurrency}
            detailFormatter={(row) =>
              `${formatQuantity(row.quantity ?? 0)} unités reçues · ${row.count ?? 0} lots`
            }
            emptyMessage="Aucune réception avec fournisseur exploitable sur la période."
          />
          <BreakdownCard
            title="Produits les plus achetés"
            description="Produits qui concentrent le plus de valeur d’achat sur la période."
            rows={insights.topPurchasedProducts}
            valueFormatter={formatCurrency}
            detailFormatter={(row) =>
              `${formatQuantity(row.quantity ?? 0)} unités reçues · ${row.count ?? 0} lots`
            }
            emptyMessage="Aucun achat valorisé disponible."
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Stock"
          description="Ce qui immobilise du cash aujourd’hui, ce qui est encore utilisable et ce qui commence à poser problème."
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <BreakdownCard
            title="Valeur du stock par catégorie"
            description="Répartition de la valeur actuellement immobilisée dans le stock utilisable."
            rows={insights.stockByCategory}
            valueFormatter={formatCurrency}
            detailFormatter={(row) =>
              `${formatQuantity(row.quantity ?? 0)} unités disponibles · ${row.count ?? 0} produits`
            }
            emptyMessage="Aucun stock valorisable disponible."
          />
          <ProductValueCard
            title="Produits avec la plus forte valeur immobilisée"
            description="Les produits qui mobilisent le plus de valeur en stock utilisable."
            rows={insights.topStockProducts}
            valueKey="availableValue"
            quantityKey="availableQuantity"
            emptyMessage="Aucun stock utilisable à valoriser."
          />
          <ProductValueCard
            title="Stock expiré à traiter"
            description="Produits qui conservent encore de la valeur dans des lots expirés."
            rows={insights.topExpiredStockProducts}
            valueKey="expiredValue"
            quantityKey="expiredQuantity"
            emptyMessage="Aucun stock expiré à signaler."
            tone="danger"
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Pertes"
          description="Ce que vous perdez réellement sur la période et sur quels produits cela se concentre."
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Card className="border-border/70 xl:col-span-8">
            <CardHeader>
              <CardTitle className="text-base">Résumé des pertes</CardTitle>
              <CardDescription>Lecture synthétique des pertes validées sur la période sélectionnée.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Valeur totale</p>
                  <p className="mt-2 text-2xl font-semibold">{formatCurrency(summary?.wasteValue ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Pertes validées sur la période choisie.</p>
                </div>
                <div className="rounded-xl border bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Quantité perdue</p>
                  <p className="mt-2 text-2xl font-semibold">{formatQuantity(summary?.wasteQty ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Volume total sorti du stock.</p>
                </div>
                <div className="rounded-xl border bg-background/80 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Sessions validées</p>
                  <p className="mt-2 text-2xl font-semibold">{wasteSessionsCount}</p>
                  <p className="text-xs text-muted-foreground">Nombre de validations sur la période.</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Produit principal</p>
                  <p className="mt-2 text-base font-semibold">{topWasteProduct?.productName ?? "Aucun produit dominant"}</p>
                  <p className="text-sm text-muted-foreground">
                    {topWasteProduct
                      ? `${formatCurrency(topWasteProduct.totalWasteValue)} · ${formatQuantity(topWasteProduct.totalWasteQty)} unités`
                      : "Aucune perte marquante sur la période."}
                  </p>
                </div>
                <div className="rounded-xl border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Lecture de la période</p>
                  <p className="mt-2 text-base font-semibold">
                    {wasteSessionsCount > 0 ? `${wasteSessionsCount} session${wasteSessionsCount > 1 ? "s" : ""} validée${wasteSessionsCount > 1 ? "s" : ""}` : "Aucune perte validée"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {wasteSessionsCount > 0
                      ? "Utilisez le détail des produits les plus perdus pour identifier les postes à surveiller."
                      : "La période sélectionnée ne montre pas encore de pertes validées."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 xl:col-span-4">
            <CardHeader>
              <CardTitle className="text-base">Produits les plus perdus</CardTitle>
              <CardDescription>Top pertes valorisées issu des sessions validées.</CardDescription>
            </CardHeader>
            <CardContent>
              {topQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : topQuery.isError ? (
                <EmptyCardMessage>Impossible de charger le top pertes.</EmptyCardMessage>
              ) : topWasteProducts.length === 0 ? (
                <EmptyCardMessage>Aucun produit concerné sur la période.</EmptyCardMessage>
              ) : (
                <div className="space-y-2">
                  {topWasteProducts.map((item) => (
                    <Link
                      key={item.productId}
                      to={`/app/catalog/${item.productId}`}
                      className="flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{formatQuantity(item.totalWasteQty)} unités perdues</p>
                      </div>
                      <p className="text-sm font-semibold">{formatCurrency(item.totalWasteValue)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Inventaires et écarts"
          description="Ce que les inventaires validés remontent aujourd’hui sur la fiabilité du stock."
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <KpiCard
            title="Sessions validées"
            value={String(inventoriesQuery.data?.total ?? 0)}
            description="Inventaires validés sur la période choisie."
            to={`/app/inventories?from=${from}&to=${to}&status=POSTED`}
          />
          <KpiCard
            title="Écarts valorisés"
            value={formatCurrency(summary?.inventoryVarianceValue ?? 0)}
            description="Montant consolidé des écarts d’inventaire sur la période."
            to="/app/inventories"
          />
          <Card className="border-border/70 bg-background/75">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-[0.16em]">Fiabilité du stock</CardDescription>
              <CardTitle className="text-lg">Suivi des écarts</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Les inventaires validés aident à repérer les écarts les plus coûteux et à fiabiliser le stock.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Alertes owner"
          description="Les signaux concrets qui méritent une action rapide : stock à risque, cash immobilisé et pertes à traiter."
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <AlertListCard
            icon={<ShieldAlert className="h-4 w-4 text-red-700" />}
            title="Stock expiré et lots à traiter"
            description={`${formatCurrency(alerts?.expiredStockValue ?? 0)} encore présents dans ${alerts?.expiredLots.length ?? 0} lots expirés.`}
            accentClass="bg-red-100 text-red-700"
            rows={(alerts?.expiredLots ?? []).map((lot) => ({
              id: lot.lotId,
              label: lot.productName,
              help: `${formatQuantity(lot.quantityRemaining)} encore présents${lot.lotCode ? ` · lot ${lot.lotCode}` : ""}`,
              to: `/app/catalog/${lot.productId}`,
            }))}
            emptyMessage="Aucun lot expiré à signaler."
          />
          <AlertListCard
            icon={<Boxes className="h-4 w-4 text-amber-700" />}
            title="Produits sous seuil"
            description={`${alerts?.lowStockProducts.length ?? 0} produits demandent une action de réapprovisionnement.`}
            accentClass="bg-amber-100 text-amber-700"
            rows={(alerts?.lowStockProducts ?? []).map((product) => ({
              id: product.productId,
              label: product.productName,
              help: `${formatQuantity(product.quantityRemaining)} disponibles pour un seuil de ${formatQuantity(product.alertThreshold)}`,
              to: `/app/catalog/${product.productId}`,
            }))}
            emptyMessage="Aucun produit sous seuil pour le moment."
          />
          <AlertListCard
            icon={<TrendingDown className="h-4 w-4 text-slate-700" />}
            title="Priorités de pilotage"
            description="Mélange des produits sous tension et du stock expiré à forte valeur."
            accentClass="bg-slate-100 text-slate-700"
            rows={ownerAlerts}
            emptyMessage="Aucune alerte prioritaire supplémentaire à remonter."
          />
        </div>
      </div>
    </section>
  );
}
