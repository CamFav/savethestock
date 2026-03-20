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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { SupplierFormValues, SupplierListItem } from "@/features/suppliers/suppliers.types";

type SupplierDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  defaultSupplier?: SupplierListItem | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
};

function getDefaultValues(supplier?: SupplierListItem | null): SupplierFormValues {
  return {
    name: supplier?.name ?? "",
    email: supplier?.email ?? "",
    phone: supplier?.phone ?? "",
  };
}

export function SupplierDialog({
  open,
  mode,
  defaultSupplier,
  onOpenChange,
  onSubmit,
}: SupplierDialogProps) {
  const form = useForm<SupplierFormValues>({
    defaultValues: getDefaultValues(defaultSupplier),
  });

  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (!open) return;
    form.reset(getDefaultValues(defaultSupplier));
  }, [defaultSupplier, form, open]);

  const title = useMemo(() => (mode === "create" ? "Nouveau fournisseur" : "Modifier le fournisseur"), [mode]);
  const submitLabel = useMemo(() => {
    if (mode === "create") return isSubmitting ? "Creation..." : "Creer";
    return isSubmitting ? "Enregistrement..." : "Enregistrer";
  }, [isSubmitting, mode]);

  async function handleSubmit(values: SupplierFormValues) {
    const name = values.name.trim();
    if (!name) {
      form.setError("name", { message: "Le nom est requis." });
      return;
    }

    await onSubmit({
      name,
      email: values.email.trim(),
      phone: values.phone.trim(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Ajoutez un fournisseur pour organiser les achats et les réceptions."
              : "Mettez à jour les informations utiles de ce fournisseur."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="name"
              rules={{ validate: (value) => (value.trim().length > 0 ? true : "Le nom est requis.") }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="organization"
                      disabled={isSubmitting}
                      maxLength={120}
                      placeholder="Ex. Primeur du Centre"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (facultatif)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="email"
                      disabled={isSubmitting}
                      maxLength={160}
                      placeholder="contact@fournisseur.fr"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telephone (facultatif)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="tel"
                      disabled={isSubmitting}
                      maxLength={40}
                      placeholder="+33 6 00 00 00 00"
                      type="tel"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
