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
import type { SupplierListItem } from "@/features/suppliers/suppliers.types";

type SuppliersTableProps = {
  canManage?: boolean;
  items: SupplierListItem[];
  pendingId?: string | null;
  onEdit: (supplier: SupplierListItem) => void;
  onDelete: (supplier: SupplierListItem) => void;
};

function formatCreatedAt(value?: string): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function buildContactLabel(supplier: SupplierListItem): string {
  if (supplier.email) return supplier.email;
  if (supplier.phone) return supplier.phone;
  return "-";
}

export function SuppliersTable({ items, pendingId, onEdit, onDelete, canManage = true }: SuppliersTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Créé le</TableHead>
            {canManage ? <TableHead className="w-[72px] text-right">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((supplier) => {
            const isPending = pendingId === supplier.id;

            return (
              <TableRow key={supplier.id} className="transition-colors duration-150">
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{buildContactLabel(supplier)}</TableCell>
                <TableCell>{formatCreatedAt(supplier.createdAt)}</TableCell>
                {canManage ? (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label={`Open actions for ${supplier.name}`}
                          size="icon"
                          variant="ghost"
                          disabled={isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onEdit(supplier)}>
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onSelect={() => onDelete(supplier)}>
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
