import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PostInventoryDialogProps = {
  open: boolean;
  pending?: boolean;
  linesCount: number;
  countedLines: number;
  discrepancyCount: number;
  totalAbsoluteDelta: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
};

export function PostInventoryDialog({
  open,
  pending,
  linesCount,
  countedLines,
  discrepancyCount,
  totalAbsoluteDelta,
  onOpenChange,
  onConfirm,
}: PostInventoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Valider cet inventaire ?</DialogTitle>
          <DialogDescription>
            Cette action appliquera les écarts comptés sur les lots et verrouillera définitivement cet inventaire.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Articles</p>
            <p className="mt-2 text-lg font-semibold">{linesCount}</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Comptées</p>
            <p className="mt-2 text-lg font-semibold">{countedLines}</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Écarts</p>
            <p className="mt-2 text-lg font-semibold">{discrepancyCount}</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total des écarts</p>
            <p className="mt-2 text-lg font-semibold">{totalAbsoluteDelta}</p>
          </div>
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
