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
import type { Category } from "@/features/categories/api/categories.types";
import type { Product } from "@/features/products/api/products.types";

const UNIT_OPTIONS = ["pcs", "kg", "g", "L", "ml"] as const;

type ProductDialogValues = {
  name: string;
  categoryId: string;
  unit: string;
  alertThreshold: string;
  isActive: boolean;
};

type ProductDialogSubmitValues = {
  name: string;
  categoryId: string;
  unit: string;
  alertThreshold: number;
  isActive: boolean;
};

type ProductDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  categories: Category[];
  defaultProduct?: Product | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProductDialogSubmitValues) => Promise<void>;
};

function getDefaultValues(defaultProduct?: Product | null): ProductDialogValues {
  return {
    name: defaultProduct?.name ?? "",
    categoryId: defaultProduct?.categoryId ?? "",
    unit: defaultProduct?.unit ?? "pcs",
    alertThreshold: String(defaultProduct?.alertThreshold ?? 0),
    isActive: defaultProduct?.isActive ?? true,
  };
}

export function ProductDialog({
  open,
  mode,
  categories,
  defaultProduct,
  onOpenChange,
  onSubmit,
}: ProductDialogProps) {
  const form = useForm<ProductDialogValues>({
    defaultValues: getDefaultValues(defaultProduct),
  });

  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (!open) return;
    form.reset(getDefaultValues(defaultProduct));
  }, [defaultProduct, form, open]);

  const title = useMemo(() => (mode === "create" ? "Nouveau produit" : "Modifier le produit"), [mode]);
  const submitLabel = useMemo(() => {
    if (mode === "create") return isSubmitting ? "Creation..." : "Creer le produit";
    return isSubmitting ? "Enregistrement..." : "Enregistrer";
  }, [isSubmitting, mode]);

  async function handleSubmit(values: ProductDialogValues) {
    const name = values.name.trim();
    const unit = values.unit.trim();
    const alertThreshold = Number(values.alertThreshold);

    if (!name) {
      form.setError("name", { message: "Le nom est requis." });
      return;
    }

    if (!values.categoryId) {
      form.setError("categoryId", { message: "La catégorie est requise." });
      return;
    }

    if (!unit) {
      form.setError("unit", { message: "L'unité est requise." });
      return;
    }

    if (!Number.isFinite(alertThreshold) || alertThreshold < 0) {
      form.setError("alertThreshold", { message: "Le seuil d'alerte doit être supérieur ou égal à 0." });
      return;
    }

    await onSubmit({
      name,
      categoryId: values.categoryId,
      unit,
      alertThreshold,
      isActive: values.isActive,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Ajoutez un produit avec son unité et son seuil d'alerte."
              : "Mettez à jour les informations du produit."}
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
                    <Input {...field} autoComplete="off" disabled={isSubmitting} maxLength={120} placeholder="Ex. Tomates concassees" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              rules={{ required: "La catégorie est requise." }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorie</FormLabel>
                  <FormControl>
                    <select
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      disabled={isSubmitting}
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                    >
                      <option value="">Choisir une catégorie</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel>Unite</FormLabel>
                    <FormControl>
                      <select
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                        disabled={isSubmitting}
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
                      >
                        {UNIT_OPTIONS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alertThreshold"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel>Seuil d'alerte</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} min={0} step="1" type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      checked={field.value}
                      disabled={isSubmitting}
                      type="checkbox"
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                    Produit actif
                  </label>
                  <p className="text-xs text-muted-foreground">Un produit inactif ne peut pas recevoir de nouveau lot.</p>
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
