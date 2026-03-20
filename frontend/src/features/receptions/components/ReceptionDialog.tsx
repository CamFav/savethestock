import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { SupplierListItem } from "@/features/suppliers/suppliers.types";

type FormValues = {
  supplierId: string;
  receptionDate: string;
  reference: string;
  notes: string;
};

type ReceptionDialogProps = {
  open: boolean;
  suppliers: SupplierListItem[];
  pending: boolean;
  defaultValues?: Partial<FormValues>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues) => Promise<void>;
};

const TODAY = new Date().toISOString().slice(0, 10);

export function ReceptionDialog({ open, suppliers, pending, defaultValues, onOpenChange, onSubmit }: ReceptionDialogProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      supplierId: defaultValues?.supplierId ?? "",
      receptionDate: defaultValues?.receptionDate ?? TODAY,
      reference: defaultValues?.reference ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      supplierId: defaultValues?.supplierId ?? "",
      receptionDate: defaultValues?.receptionDate ?? TODAY,
      reference: defaultValues?.reference ?? "",
      notes: defaultValues?.notes ?? "",
    });
  }, [defaultValues?.notes, defaultValues?.receptionDate, defaultValues?.reference, defaultValues?.supplierId, form, open]);

  const disabled = pending;
  const submitLabel = useMemo(() => (pending ? "Création..." : "Créer"), [pending]);

  async function handleSubmit(values: FormValues) {
    if (!values.supplierId) {
      form.setError("supplierId", { message: "Le fournisseur est requis." });
      return;
    }

    if (!values.receptionDate) {
      form.setError("receptionDate", { message: "La date de réception est requise." });
      return;
    }

    await onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle réception</DialogTitle>
          <DialogDescription>Créez une réception avant d’ajouter les lots reçus.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fournisseur</FormLabel>
                  <FormControl>
                    <select
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      disabled={disabled}
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                    >
                      <option value="">Sélectionner un fournisseur</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Obligatoire pour relier cette réception à un fournisseur.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receptionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de réception</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Référence (optionnel)</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={disabled} maxLength={64} placeholder="Ex. REC-2026-014" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optionnel)</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={disabled} maxLength={240} placeholder="Contexte ou remarque utile" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" disabled={disabled} onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={disabled || suppliers.length === 0}>
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
