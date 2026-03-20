import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InventoryStatusBadge } from "@/features/inventories/components/inventory-status-badge";
import type { Inventory } from "@/features/inventories/api/inventories.types";

type InventoriesTableProps = {
  items: Inventory[];
};

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function renderPostedBy(status: string, postedByName?: string): string {
  if (status.toUpperCase() !== "POSTED") return "";
  return postedByName ?? "—";
}

export function InventoriesTable({ items }: InventoriesTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-background/80">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Valide par</TableHead>
            <TableHead>Articles</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead className="w-[120px] text-right">Accès</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((inventory) => (
            <TableRow key={inventory.id}>
              <TableCell>{formatDate(inventory.inventoryDate)}</TableCell>
              <TableCell>
                <InventoryStatusBadge status={inventory.status} />
              </TableCell>
              <TableCell>{renderPostedBy(inventory.status, inventory.postedByName)}</TableCell>
              <TableCell>{inventory.lines.length}</TableCell>
              <TableCell>{formatDate(inventory.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm" variant="ghost" className="rounded-xl px-3" aria-label="Ouvrir l’inventaire">
                  <Link to={`/app/inventories/${inventory.id}`}>Ouvrir</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
