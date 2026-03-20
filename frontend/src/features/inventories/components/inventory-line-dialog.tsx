import { useEffect, useMemo, useState } from "react";
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
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { InventoryLine } from "@/features/inventories/api/inventories.types";

type ProductOption = {
  id: string;
  label: string;
};

type FormValues = {
  productId: string;
  realQuantity: string;
};

type InventoryLineDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  productOptions: ProductOption[];
  defaultLine?: InventoryLine | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { productId: string; realQuantity: number }) => Promise<void>;
};

function getDefaultValues(defaultLine?: InventoryLine | null): FormValues {
  return {
    productId: defaultLine?.productId ?? "",
    realQuantity: defaultLine ? String(defaultLine.realQuantity) : "",
  };
}

export function InventoryLineDialog({
  open,
  mode,
  productOptions,
  defaultLine,
  pending,
  onOpenChange,
  onSubmit,
}: InventoryLineDialogProps) {
  const form = useForm<FormValues>({
    defaultValues: getDefaultValues(defaultLine),
  });

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setSearch("");
    form.reset(getDefaultValues(defaultLine));
  }, [defaultLine, form, open]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return productOptions;
    return productOptions.filter((item) => item.label.toLowerCase().includes(q));
  }, [productOptions, search]);

  async function handleSubmit(values: FormValues) {
    const productId = mode === "edit" && defaultLine ? defaultLine.productId : values.productId;
    if (!productId) {
      form.setError("productId", { message: "Le produit est requis." });
      return;
    }

    const realQuantity = Number(values.realQuantity);
    if (!Number.isFinite(realQuantity) || realQuantity < 0) {
      form.setError("realQuantity", { message: "La quantité réelle doit être supérieure ou égale à 0." });
      return;
    }

    await onSubmit({ productId, realQuantity });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Ajouter un article" : "Modifier l’article"}</DialogTitle>
          <DialogDescription>Choisissez le produit et saisissez la quantité réellement comptée.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            {mode === "create" ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="inventory-line-product-search">
                    Rechercher un produit
                  </label>
                  <Input
                    id="inventory-line-product-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher dans les produits"
                    disabled={pending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="inventory-line-product">
                    Produit
                  </label>
                  <select
                    id="inventory-line-product"
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    disabled={pending}
                    {...form.register("productId")}
                  >
                    <option value="">Sélectionner un produit</option>
                    {filteredOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.productId ? (
                    <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.productId.message}</p>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="rounded-md border p-3 text-sm">
                <p className="text-muted-foreground">Produit</p>
                <p className="font-medium">{productOptions.find((item) => item.id === defaultLine?.productId)?.label ?? "—"}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="inventory-line-real-quantity">
                Quantité réelle
              </label>
              <Input
                id="inventory-line-real-quantity"
                type="number"
                min={0}
                step="0.01"
                disabled={pending}
                {...form.register("realQuantity")}
              />
              {form.formState.errors.realQuantity ? (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.realQuantity.message}</p>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Enregistrement..." : mode === "create" ? "Ajouter l’article" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
