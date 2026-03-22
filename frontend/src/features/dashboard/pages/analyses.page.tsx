import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoriesList } from "@/features/categories/api/categories.queries";
import { useDashboardSummary, useDashboardTopWasteProducts } from "@/features/dashboard/api/dashboard.queries";
import { buildAnalysisInsights } from "@/features/dashboard/dashboard-finance.utils";
import { useLotsList } from "@/features/lots/api/lots.queries";
import { useProductsAll } from "@/features/products/api/products.queries";
import { useReceptionsList } from "@/features/receptions/api/receptions.queries";
import { useSuppliersAll } from "@/features/suppliers/api/suppliers.queries";
import { useWasteSessionsList } from "@/features/waste-sessions/api/wasteSessions.queries";
import { ModuleHeroHeader } from "@/shared/ui/module-hero-header";
import type { ApiError } from "@/shared/api/apiClient";

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

export function AnalysesPage() {
  const initialRange = useMemo(() => getPresetRange("14d"), []);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("14d");
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);

  const summaryParams = useMemo(() => ({ from: from || undefined, to: to || undefined }), [from, to]);
  const topParams = useMemo(() => ({ from: from || undefined, to: to || undefined, limit: 5 }), [from, to]);

  const summaryQuery = useDashboardSummary(summaryParams);
  const topQuery = useDashboardTopWasteProducts(topParams);

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

  const hasFatalError = summaryQuery.isError && topQuery.isError;
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
          <CardDescription>Choisissez la fenêtre de lecture à analyser.</CardDescription>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-5">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Du</p>
              <Input type="date" value={from} onChange={(event) => onFromChange(event.target.value)} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Au</p>
              <Input type="date" value={to} onChange={(event) => onToChange(event.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <SectionHeader
          title="Achats"
          description="Où part l’argent sur la période, par catégorie, fournisseur et produit."
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Stock"
          description="Où la valeur reste immobilisée aujourd’hui et quels produits pèsent le plus dans le stock exploitable."
        />
        <div className="grid grid-cols-1 gap-4">
          <ProductValueCard
            title="Produits avec la plus forte valeur immobilisée"
            description="Les produits qui mobilisent le plus de valeur en stock utilisable."
            rows={insights.topStockProducts}
            valueKey="availableValue"
            quantityKey="availableQuantity"
            emptyMessage="Aucun stock utilisable à valoriser."
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader
          title="Pertes"
          description="Ce que vous perdez réellement sur la période et sur quels produits cela se concentre."
        />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Card className="border-border/70">
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
              <div className="rounded-xl border bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Produit principal</p>
                <p className="mt-2 text-base font-semibold">{topWasteProduct?.productName ?? "Aucun produit dominant"}</p>
                <p className="text-sm text-muted-foreground">
                  {topWasteProduct
                    ? `${formatCurrency(topWasteProduct.totalWasteValue)} · ${formatQuantity(topWasteProduct.totalWasteQty)} unités`
                    : "Aucune perte marquante sur la période."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
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

    </section>
  );
}
