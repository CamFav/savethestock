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
import type { ReceptionListItem } from "@/features/receptions/receptions.types";

type ReceptionsTableProps = {
  items: ReceptionListItem[];
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

export function ReceptionsTable({ items }: ReceptionsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-background/80">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Fournisseur</TableHead>
            <TableHead className="w-[120px] text-right">Accès</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((reception) => (
            <TableRow key={reception.id} className="transition-colors duration-150">
              <TableCell>{formatDate(reception.receptionDate ?? reception.createdAt)}</TableCell>
              <TableCell className="font-medium">{reception.supplierName ?? "Fournisseur inconnu"}</TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm" variant="ghost" className="rounded-xl px-3" aria-label="Ouvrir la réception">
                  <Link to={`/app/receptions/${reception.id}`}>Ouvrir</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
