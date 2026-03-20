import { AlertTriangle, MoreHorizontal, ReceiptText, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getLotExpiryVariant, getLotRemainingQuantity, isLotExpired } from "@/features/lots/lots-stock.utils";
import type { LotListItem } from "@/features/lots/lots.types";

type LotsTableProps = {
  items: LotListItem[];
  pendingDeleteId?: string | null;
  highlightedId?: string | null;
  onDeclareWaste?: (lot: LotListItem) => void;
  onDelete?: (lot: LotListItem) => void;
  onEdit?: (lot: LotListItem) => void;
  showReception?: boolean;
};

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return "—";
  return value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function LotsTable({ items, pendingDeleteId, highlightedId, onDeclareWaste, onDelete, onEdit, showReception = false }: LotsTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produit</TableHead>
            <TableHead>Code lot</TableHead>
            <TableHead>Péremption</TableHead>
            <TableHead>Qté reçue</TableHead>
            <TableHead>Restant</TableHead>
            <TableHead>Coût unitaire</TableHead>
            <TableHead>Anomalie</TableHead>
            {showReception ? <TableHead>Réception</TableHead> : null}
            <TableHead>Créé le</TableHead>
            <TableHead className="w-[80px] text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((lot) => {
            const isPending = pendingDeleteId === lot.id;
            const expiryVariant = getLotExpiryVariant(lot.expiryDate);
            const lotIsExpired = isLotExpired(lot.expiryDate) && getLotRemainingQuantity(lot) > 0;
            const hasActions = Boolean(onEdit || onDelete || (lotIsExpired && onDeclareWaste) || lot.receptionId);

            return (
              <TableRow
                key={lot.id}
                id={`lot-row-${lot.id}`}
                className={cn(
                  "transition-colors duration-150",
                  highlightedId === lot.id && "bg-emerald-50/80 transition-colors duration-700",
                  lotIsExpired && "bg-slate-50 text-muted-foreground",
                )}
              >
                <TableCell className="font-medium">
                  <Button asChild variant="link" className="h-auto px-0 py-0 text-left font-medium text-foreground">
                    <Link to={`/app/catalog/${lot.productId}`}>{lot.productName ?? "Produit inconnu"}</Link>
                  </Button>
                </TableCell>
                <TableCell>{lot.lotCode ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{formatDate(lot.expiryDate)}</span>
                    {expiryVariant === "expired" ? (
                      <span className="inline-flex rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs text-red-700">
                        Expiré
                      </span>
                    ) : null}
                    {expiryVariant === "soon" ? (
                      <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                        Bientôt expiré
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{lot.quantityInitial}</TableCell>
                <TableCell>{lot.quantityRemaining ?? "—"}</TableCell>
                <TableCell>{formatCurrency(lot.unitCost)}</TableCell>
                <TableCell>
                  {lot.hasIssue ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                            <AlertTriangle className="h-3 w-3" />
                            Anomalie
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{lot.issueNote ?? "Aucun détail."}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                {showReception ? (
                  <TableCell>
                    {lot.receptionId ? (
                      <Button asChild size="sm" variant="ghost" className="h-7 px-2">
                        <Link to={`/app/receptions/${lot.receptionId}`}>Ouvrir la réception</Link>
                      </Button>
                    ) : (
                      <span className="inline-flex rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                        Saisie directe
                      </span>
                    )}
                  </TableCell>
                ) : null}
                <TableCell>{formatDate(lot.createdAt)}</TableCell>
                <TableCell className="text-right">
                  {hasActions ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label={`Ouvrir les actions du lot ${lot.productName ?? "sans nom"}`}
                          size="icon"
                          variant="ghost"
                          disabled={isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {lotIsExpired && onDeclareWaste ? (
                          <DropdownMenuItem onSelect={() => onDeclareWaste(lot)}>
                            <Trash2 className="h-4 w-4" />
                            Déclarer en pertes
                          </DropdownMenuItem>
                        ) : null}
                        {lot.receptionId ? (
                          <DropdownMenuItem asChild>
                            <Link to={`/app/receptions/${lot.receptionId}`}>
                              <ReceiptText className="h-4 w-4" />
                              Ouvrir la réception
                            </Link>
                          </DropdownMenuItem>
                        ) : null}
                        {onEdit ? (
                          <DropdownMenuItem onSelect={() => onEdit(lot)}>
                            Modifier
                          </DropdownMenuItem>
                        ) : null}
                        {onDelete ? (
                          <DropdownMenuItem className="text-destructive" onSelect={() => onDelete(lot)}>
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
