import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PostWasteSessionDialogProps = {
  open: boolean;
  pending?: boolean;
  linesCount: number;
  productsCount: number;
  lotsCount: number;
  totalQuantity: number;
  estimatedValue: number;
  reasonsSummary: string[];
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function PostWasteSessionDialog({
  open,
  pending,
  productsCount,
  lotsCount,
  totalQuantity,
  estimatedValue,
  reasonsSummary,
  onOpenChange,
  onConfirm,
}: PostWasteSessionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Valider cette perte ?</DialogTitle>
          <DialogDescription>
            Cette action appliquera les sorties de stock sur les lots sélectionnés et verrouillera définitivement cette perte.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Produits</p>
            <p className="mt-2 text-lg font-semibold">{productsCount}</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Lots</p>
            <p className="mt-2 text-lg font-semibold">{lotsCount}</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Quantité totale</p>
            <p className="mt-2 text-lg font-semibold">{totalQuantity}</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Valeur estimée</p>
            <p className="mt-2 text-lg font-semibold">{formatCurrency(estimatedValue)}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/20 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Motifs</p>
          <p className="mt-2 text-sm font-medium">{reasonsSummary.join(" · ") || "—"}</p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" disabled={pending} onClick={() => void onConfirm()}>
            {pending ? "Validation..." : "Valider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
