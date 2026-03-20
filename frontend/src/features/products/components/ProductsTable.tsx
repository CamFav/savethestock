import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Product } from "@/features/products/api/products.types";

type ProductsTableProps = {
  canManage?: boolean;
  items: Product[];
  pendingId?: string | null;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function ProductsTable({ items, pendingId, onEdit, onDelete, canManage = true }: ProductsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Unité</TableHead>
            <TableHead>Seuil d&apos;alerte</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Créé le</TableHead>
            {canManage ? <TableHead className="w-[72px] text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((product) => {
            const isPending = pendingId === product.id;

            return (
              <TableRow key={product.id} className="transition-colors duration-150">
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell>{product.alertThreshold ?? "—"}</TableCell>
                <TableCell>
                  {product.isActive ? (
                    <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                      Inactive
                    </span>
                  )}
                </TableCell>
                <TableCell>{formatCreatedAt(product.createdAt)}</TableCell>
                {canManage ? (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label={`Open actions for ${product.name}`}
                          size="icon"
                          variant="ghost"
                          disabled={isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onEdit(product)}>
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onSelect={() => onDelete(product)}>
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
