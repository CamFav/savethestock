import { Button } from "@/components/ui/button";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeId?: string;
};

export function Pagination({
  page,
  pageSize,
  total,
  disabled,
  onPageChange,
  onPageSizeChange,
  pageSizeId = "page-size",
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} sur {totalPages} · {total} élément{total > 1 ? "s" : ""}
      </p>

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor={pageSizeId}>
          Par page
        </label>
        <select
          id={pageSizeId}
          className="h-9 rounded-xl border border-input bg-background px-3 text-sm shadow-sm"
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
