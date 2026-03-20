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

type FormValues = {
  inventoryDate: string;
  comment: string;
};

type CreateInventoryDialogProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { inventoryDate: string; comment: string }) => Promise<void> | void;
};

function getDefaultDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CreateInventoryDialog({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: CreateInventoryDialogProps) {
  const defaultDate = useMemo(() => getDefaultDate(), []);

  const form = useForm<FormValues>({
    defaultValues: {
      inventoryDate: defaultDate,
      comment: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        inventoryDate: getDefaultDate(),
        comment: "",
      });
    }
  }, [form, open]);

  async function handleSubmit(values: FormValues) {
    if (!values.inventoryDate) {
      form.setError("inventoryDate", { message: "La date est requise." });
      return;
    }

    await onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel inventaire</DialogTitle>
          <DialogDescription>Créez un brouillon avant de saisir les quantités réellement comptées.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="inventoryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" disabled={pending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commentaire (optionnel)</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={pending} placeholder="Contexte utile pour l’équipe" maxLength={240} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Création..." : "Créer le brouillon"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
