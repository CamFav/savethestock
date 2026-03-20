import { MoreHorizontal, Trash2 } from "lucide-react";
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
import { WasteStatusBadge } from "@/features/waste-sessions/components/waste-status-badge";
import type { WasteSession } from "@/features/waste-sessions/api/wasteSessions.types";

type WasteSessionsTableProps = {
  items: WasteSession[];
  deletePendingId?: string | null;
  onDelete?: (session: WasteSession) => void;
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

export function WasteSessionsTable({ items, deletePendingId, onDelete }: WasteSessionsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-background/80">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Valide par</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead className="w-[120px] text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((session) => (
            <TableRow key={session.id}>
              <TableCell>{formatDate(session.wasteDate)}</TableCell>
              <TableCell>
                <WasteStatusBadge status={session.status} />
              </TableCell>
              <TableCell>{renderPostedBy(session.status, session.postedByName)}</TableCell>
              <TableCell>{formatDate(session.createdAt)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" disabled={deletePendingId === session.id}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/app/waste-sessions/${session.id}`}>Ouvrir</Link>
                    </DropdownMenuItem>
                    {session.status?.toUpperCase() === "DRAFT" && onDelete ? (
                      <DropdownMenuItem className="text-destructive" onSelect={() => onDelete(session)}>
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
