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
import type { WasteLine } from "@/features/waste-sessions/api/wasteSessions.types";
import type { WasteLotOption } from "@/features/waste-sessions/waste-lot-options";

const STANDARD_REASONS = ["Expiration", "Casse", "Produit abîmé", "Erreur inventaire", "Erreur réception", "Autre"] as const;

type FormValues = {
  lotId: string;
  quantity: string;
  reasonChoice: string;
  customReason: string;
};

type WasteLineDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  lotOptions: WasteLotOption[];
  defaultLine?: WasteLine | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { lotId: string; quantity: number; reason: string }) => Promise<void>;
};

function getDefaultValues(defaultLine?: WasteLine | null): FormValues {
  const matchesStandardReason = STANDARD_REASONS.includes((defaultLine?.reason ?? "") as (typeof STANDARD_REASONS)[number]);
  return {
    lotId: defaultLine?.lotId ?? "",
    quantity: defaultLine ? String(defaultLine.quantity) : "",
    reasonChoice: matchesStandardReason ? defaultLine?.reason ?? "" : defaultLine?.reason ? "Autre" : "Expiration",
    customReason: matchesStandardReason ? "" : defaultLine?.reason ?? "",
  };
}

export function WasteLineDialog({ open, mode, lotOptions, defaultLine, pending, onOpenChange, onSubmit }: WasteLineDialogProps) {
  const form = useForm<FormValues>({
    defaultValues: getDefaultValues(defaultLine),
  });

  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState("all");

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelectedCategoryId("all");
    setSelectedProductId("all");
    form.reset(getDefaultValues(defaultLine));
  }, [defaultLine, form, open]);

  const categoryOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const item of lotOptions) {
      if (item.categoryId && item.categoryName) {
        seen.set(item.categoryId, item.categoryName);
      }
    }

    return Array.from(seen.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr-FR"));
  }, [lotOptions]);

  const productOptions = useMemo(() => {
    const seen = new Map<string, { id: string; label: string; categoryId?: string }>();
    for (const item of lotOptions) {
      if (selectedCategoryId !== "all" && item.categoryId !== selectedCategoryId) {
        continue;
      }

      seen.set(item.productId, {
        id: item.productId,
        label: item.productName,
        categoryId: item.categoryId,
      });
    }

    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label, "fr-FR"));
  }, [lotOptions, selectedCategoryId]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();

    return lotOptions.filter((item) => {
      if (selectedCategoryId !== "all" && item.categoryId !== selectedCategoryId) {
        return false;
      }

      if (selectedProductId !== "all" && item.productId !== selectedProductId) {
        return false;
      }

      if (!q) {
        return true;
      }

      const haystack = [
        item.productName,
        item.categoryName,
        item.lotCode,
        item.label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [lotOptions, search, selectedCategoryId, selectedProductId]);

  const selectedLotId = mode === "edit" && defaultLine ? defaultLine.lotId : form.watch("lotId");
  const selectedLot = useMemo(() => {
    return lotOptions.find((item) => item.id === selectedLotId) ?? null;
  }, [lotOptions, selectedLotId]);

  const selectedReasonChoice = form.watch("reasonChoice");
  const quantityValue = Number(form.watch("quantity"));
  const canSubmit =
    pending ||
    !selectedLotId ||
    !Number.isFinite(quantityValue) ||
    quantityValue <= 0 ||
    (selectedLot ? quantityValue > selectedLot.remainingQuantity : false) ||
    (selectedReasonChoice === "Autre" ? !form.watch("customReason").trim() : !selectedReasonChoice.trim());

  async function handleSubmit(values: FormValues) {
    const lotId = mode === "edit" && defaultLine ? defaultLine.lotId : values.lotId;
    if (!lotId) {
      form.setError("lotId", { message: "Le lot est requis." });
      return;
    }

    const quantity = Number(values.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      form.setError("quantity", { message: "La quantité doit être supérieure à 0." });
      return;
    }

    if (selectedLot && quantity > selectedLot.remainingQuantity) {
      form.setError("quantity", { message: "La quantité ne peut pas dépasser le restant du lot." });
      return;
    }

    const reason = (values.reasonChoice === "Autre" ? values.customReason : values.reasonChoice).trim();
    if (!reason) {
      form.setError(values.reasonChoice === "Autre" ? "customReason" : "reasonChoice", { message: "Le motif est requis." });
      return;
    }

    await onSubmit({ lotId, quantity, reason });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Ajouter un lot" : "Modifier le lot"}</DialogTitle>
          <DialogDescription>Choisissez le lot, la quantité perdue et le motif associé.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            {mode === "create" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="waste-line-category">
                      Catégorie
                    </label>
                    <select
                      id="waste-line-category"
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      value={selectedCategoryId}
                      onChange={(event) => {
                        setSelectedCategoryId(event.target.value);
                        setSelectedProductId("all");
                      }}
                      disabled={pending}
                    >
                      <option value="all">Toutes les catégories</option>
                      {categoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="waste-line-product-filter">
                      Produit
                    </label>
                    <select
                      id="waste-line-product-filter"
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      value={selectedProductId}
                      onChange={(event) => setSelectedProductId(event.target.value)}
                      disabled={pending}
                    >
                      <option value="all">Tous les produits</option>
                      {productOptions.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="waste-line-lot-search">
                    Rechercher un lot
                  </label>
                  <Input
                    id="waste-line-lot-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher par lot, produit ou date"
                    disabled={pending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="waste-line-lot">
                    Lot
                  </label>
                  <select
                    id="waste-line-lot"
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    disabled={pending}
                    {...form.register("lotId")}
                  >
                    <option value="">Sélectionner un lot</option>
                    {filteredOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {filteredOptions.length} lot(s) éligible(s) avec quantité restante. Les lots expirés remontent en premier.
                  </p>
                  {form.formState.errors.lotId ? (
                    <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.lotId.message}</p>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="rounded-md border p-3 text-sm">
                <p className="text-muted-foreground">Lot</p>
                <p className="font-medium">{lotOptions.find((item) => item.id === defaultLine?.lotId)?.label ?? "—"}</p>
              </div>
            )}

            {selectedLot ? (
              <div className="grid gap-3 rounded-md border bg-muted/20 p-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Produit</p>
                  <p className="font-medium">{selectedLot.productName}</p>
                  {selectedLot.categoryName ? <p className="text-xs text-muted-foreground">{selectedLot.categoryName}</p> : null}
                </div>
                <div>
                  <p className="text-muted-foreground">Référence</p>
                  <p className="font-medium">{selectedLot.lotCode ?? "Sans code"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quantité restante</p>
                  <p className="font-medium">
                    {selectedLot.remainingQuantity}
                    {selectedLot.unit ? ` ${selectedLot.unit}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date limite</p>
                  <p className="font-medium">{selectedLot.expiryDate ?? "Non renseignée"}</p>
                  {selectedLot.isExpired ? <p className="text-xs font-medium text-red-700">Lot expiré</p> : null}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="waste-line-quantity">
                Quantité
              </label>
              <Input id="waste-line-quantity" type="number" min={0} step="0.01" disabled={pending} {...form.register("quantity")} />
              {selectedLot ? (
                <p className="text-xs text-muted-foreground">
                  Maximum autorisé : {selectedLot.remainingQuantity}
                  {selectedLot.unit ? ` ${selectedLot.unit}` : ""}
                </p>
              ) : null}
              {form.formState.errors.quantity ? (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.quantity.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="waste-line-reason-choice">
                Motif
              </label>
              <select
                id="waste-line-reason-choice"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                disabled={pending}
                {...form.register("reasonChoice")}
              >
                {STANDARD_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              {form.formState.errors.reasonChoice ? (
                <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.reasonChoice.message}</p>
              ) : null}
            </div>

            {form.watch("reasonChoice") === "Autre" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="waste-line-custom-reason">
                  Précision
                </label>
                <Input
                  id="waste-line-custom-reason"
                  maxLength={120}
                  disabled={pending}
                  placeholder="Précisez le motif"
                  {...form.register("customReason")}
                />
                {form.formState.errors.customReason ? (
                  <p className="text-[0.8rem] font-medium text-destructive">{form.formState.errors.customReason.message}</p>
                ) : null}
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={canSubmit}>
                {pending ? "Enregistrement..." : mode === "create" ? "Ajouter la ligne" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
