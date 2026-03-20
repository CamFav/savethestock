import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ConfirmDangerDialogProps = {
  open: boolean;
  pending?: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmText?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
};

export function ConfirmDangerDialog({
  open,
  pending = false,
  title,
  description,
  confirmLabel,
  confirmText,
  onOpenChange,
  onConfirm,
}: ConfirmDangerDialogProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!open) {
      setValue("");
    }
  }, [open]);

  const requiresText = Boolean(confirmText);
  const canConfirm = !requiresText || value.trim() === confirmText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {requiresText ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Tapez <span className="font-semibold text-foreground">{confirmText}</span> pour confirmer.
            </p>
            <Input value={value} onChange={(event) => setValue(event.target.value)} disabled={pending} />
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending || !canConfirm}
            onClick={() => void onConfirm()}
          >
            {pending ? "Suppression..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
