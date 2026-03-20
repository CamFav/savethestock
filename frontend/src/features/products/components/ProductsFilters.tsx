import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category } from "@/features/categories/api/categories.types";

type ProductsFiltersProps = {
  categories: Category[];
  selectedCategoryId: string;
  statusFilter: "all" | "active" | "inactive";
  disabled?: boolean;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: "all" | "active" | "inactive") => void;
  onReset: () => void;
};

export function ProductsFilters({
  categories,
  selectedCategoryId,
  statusFilter,
  disabled,
  onCategoryChange,
  onStatusChange,
  onReset,
}: ProductsFiltersProps) {
  const hasActiveFilters = selectedCategoryId.length > 0 || statusFilter !== "all";

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_180px_auto] md:items-end">
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="products-category-filter">
          Categorie
        </label>
        <select
          id="products-category-filter"
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          disabled={disabled}
          value={selectedCategoryId}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor="products-status-filter">
          Etat
        </label>
        <select
          id="products-status-filter"
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          disabled={disabled}
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value as "all" | "active" | "inactive")}
        >
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      {hasActiveFilters && (
        <Button className="md:self-end" disabled={disabled} type="button" variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Reinitialiser
        </Button>
      )}
    </div>
  );
}
