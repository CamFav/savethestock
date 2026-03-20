import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/features/products/api/products.types";

type LotsFiltersProps = {
  products: Product[];
  productId: string;
  showOnlyIssues: boolean;
  showExpired: boolean;
  expiringBefore: string;
  onProductChange: (value: string) => void;
  onExpiringBeforeChange: (value: string) => void;
  onShowOnlyIssuesChange: (value: boolean) => void;
  onShowExpiredChange: (value: boolean) => void;
  onReset: () => void;
  disabled?: boolean;
};

export function LotsFilters({
  products,
  productId,
  showOnlyIssues,
  showExpired,
  expiringBefore,
  onProductChange,
  onExpiringBeforeChange,
  onShowOnlyIssuesChange,
  onShowExpiredChange,
  onReset,
  disabled,
}: LotsFiltersProps) {
  const hasActiveFilters = productId.length > 0 || showOnlyIssues || showExpired || expiringBefore.length > 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_180px_auto]">
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          disabled={disabled}
          value={productId}
          onChange={(event) => onProductChange(event.target.value)}
        >
          <option value="">Tous les produits</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>

        <Input
          type="date"
          aria-label="Date limite"
          disabled={disabled}
          value={expiringBefore}
          onChange={(event) => onExpiringBeforeChange(event.target.value)}
        />

        {hasActiveFilters ? (
          <Button variant="outline" disabled={disabled} onClick={onReset}>
            Réinitialiser
          </Button>
        ) : (
          <div />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            checked={showOnlyIssues}
            disabled={disabled}
            type="checkbox"
            onChange={(event) => onShowOnlyIssuesChange(event.target.checked)}
          />
          Afficher seulement les anomalies
        </label>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            checked={showExpired}
            disabled={disabled}
            type="checkbox"
            onChange={(event) => onShowExpiredChange(event.target.checked)}
          />
          Afficher les lots expirés
        </label>
      </div>

      <p className="text-xs text-muted-foreground">Filtrez les lots par produit, date limite ou anomalie.</p>
    </div>
  );
}
