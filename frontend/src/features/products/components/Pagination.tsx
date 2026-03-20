import { Button } from "@/components/ui/button";

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function Pagination({
  page,
  pageSize,
  total,
  disabled,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} sur {totalPages}
      </p>

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="products-page-size">
          Par page
        </label>
        <select
          id="products-page-size"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          disabled={disabled}
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <Button size="sm" variant="outline" disabled={disabled || !canPrev} onClick={() => onPageChange(page - 1)}>
          Précédent
        </Button>
        <Button size="sm" variant="outline" disabled={disabled || !canNext} onClick={() => onPageChange(page + 1)}>
          Suivant
        </Button>
      </div>
    </div>
  );
}
