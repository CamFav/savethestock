import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteSupplierDialogProps = {
  open: boolean;
  supplierName?: string;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
};

export function DeleteSupplierDialog({
  open,
  supplierName,
  pending,
  onOpenChange,
  onConfirm,
}: DeleteSupplierDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirer ce fournisseur ?</DialogTitle>
          <DialogDescription>
            {supplierName
              ? `"${supplierName}" n'apparaîtra plus dans les listes actives.`
              : "Ce fournisseur n'apparaîtra plus dans les listes actives."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={() => void onConfirm()}>
            {pending ? "Suppression..." : "Retirer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
