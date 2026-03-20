import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReceptionDetail } from "@/features/receptions/receptions.types";

type ReceptionMetaCardProps = {
  reception: ReceptionDetail;
  supplierName?: string;
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

function getReceptionStatusLabel(status?: string): string {
  const normalized = status?.toUpperCase();
  if (normalized === "DRAFT") return "Brouillon";
  if (normalized === "POSTED") return "Validée";
  if (normalized === "CANCELLED") return "Annulée";
  return status ?? "—";
}

export function ReceptionMetaCard({ reception, supplierName }: ReceptionMetaCardProps) {
  return (
    <Card className="panel-muted">
      <CardHeader>
        <CardTitle className="text-base">Détails de la réception</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Fournisseur</p>
          <p className="font-medium">{supplierName ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Date</p>
          <p className="font-medium">{formatDate(reception.receptionDate ?? reception.createdAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Référence</p>
          <p className="font-medium">{reception.reference ?? "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Statut</p>
          <p className="font-medium">{getReceptionStatusLabel(reception.status)}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-muted-foreground">Note</p>
          <p className="font-medium">{reception.issueNote ?? "—"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
