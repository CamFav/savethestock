import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
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
import type { LotListItem } from "@/features/lots/lots.types";
import type { Product } from "@/features/products/api/products.types";
import type { ReceptionListItem } from "@/features/receptions/receptions.types";

type Mode = "quick" | "attach";

type FormValues = {
  productId: string;
  quantityInitial: string;
  receptionId: string;
  lotCode: string;
  expiryDate: string;
  unitCost: string;
  hasIssue: boolean;
  issueNote: string;
};

type LotDialogSubmitValues = {
  productId: string;
  quantityInitial: number;
  receptionId?: string;
  lotCode?: string;
  expiryDate?: string;
  unitCost?: number;
  hasIssue: boolean;
  issueNote?: string;
};

type LotDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  products: Product[];
  receptions: ReceptionListItem[];
  fixedReceptionId?: string;
  defaultLot?: LotListItem | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LotDialogSubmitValues) => Promise<void>;
};

function formatReceptionLabel(reception: ReceptionListItem): string {
  const shortId = reception.id.slice(0, 8);
  const date = reception.receptionDate ?? reception.createdAt;
  return date ? `Reception #${shortId} · ${date}` : `Reception #${shortId}`;
}

function getDefaultValues(defaultLot?: LotListItem | null, fixedReceptionId?: string): FormValues {
  return {
    productId: defaultLot?.productId ?? "",
    quantityInitial: defaultLot ? String(defaultLot.quantityInitial) : "1",
    receptionId: fixedReceptionId ?? defaultLot?.receptionId ?? "",
    lotCode: defaultLot?.lotCode ?? "",
    expiryDate: defaultLot?.expiryDate ? String(defaultLot.expiryDate).slice(0, 10) : "",
    unitCost: defaultLot?.unitCost !== undefined ? String(defaultLot.unitCost) : "",
    hasIssue: defaultLot?.hasIssue ?? false,
    issueNote: defaultLot?.issueNote ?? "",
  };
}

export function LotDialog({
  open,
  mode,
  products,
  receptions,
  fixedReceptionId,
  defaultLot,
  pending,
  onOpenChange,
  onSubmit,
}: LotDialogProps) {
  const form = useForm<FormValues>({
    defaultValues: getDefaultValues(defaultLot, fixedReceptionId),
  });

  const canAttach = fixedReceptionId !== undefined || receptions.length > 0;
  const [entryMode, setEntryMode] = useState<Mode>(fixedReceptionId || receptions.length > 0 ? "attach" : "quick");

  useEffect(() => {
    if (!open) return;
    setEntryMode(fixedReceptionId || receptions.length > 0 ? "attach" : "quick");
    form.reset(getDefaultValues(defaultLot, fixedReceptionId));
  }, [defaultLot, fixedReceptionId, form, open, receptions.length]);

  const disabled = pending;
  const submitLabel = useMemo(() => {
    if (mode === "create") return pending ? "Ajout..." : "Ajouter le lot";
    return pending ? "Enregistrement..." : "Enregistrer";
  }, [mode, pending]);

  async function handleSubmit(values: FormValues) {
    const quantityInitial = Number(values.quantityInitial);

    if (!values.productId) {
      form.setError("productId", { message: "Le produit est requis." });
      return;
    }

    const selectedProduct = products.find((item) => item.id === values.productId);
    if (selectedProduct && !selectedProduct.isActive) {
      form.setError("productId", { message: "Les produits inactifs ne peuvent pas recevoir de nouveaux lots." });
      return;
    }

    if (mode === "create" && (!Number.isFinite(quantityInitial) || quantityInitial <= 0)) {
      form.setError("quantityInitial", { message: "La quantité doit être supérieure à 0." });
      return;
    }

    const selectedReceptionId = fixedReceptionId ?? (entryMode === "attach" ? values.receptionId : undefined);
    if (mode === "create" && entryMode === "attach" && !fixedReceptionId && !selectedReceptionId) {
      form.setError("receptionId", { message: "La réception est requise dans ce mode." });
      return;
    }

    const unitCostRaw = values.unitCost.trim();
    const unitCost = unitCostRaw.length > 0 ? Number(unitCostRaw) : undefined;
    if (unitCost !== undefined && (!Number.isFinite(unitCost) || unitCost < 0)) {
      form.setError("unitCost", { message: "Le coût unitaire doit être supérieur ou égal à 0." });
      return;
    }

    await onSubmit({
      productId: values.productId,
      quantityInitial: mode === "create" ? quantityInitial : defaultLot?.quantityInitial ?? 0,
      receptionId: selectedReceptionId,
      lotCode: values.lotCode.trim() || undefined,
      expiryDate: values.expiryDate || undefined,
      unitCost,
      hasIssue: values.hasIssue,
      issueNote: values.issueNote.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Ajouter un lot" : "Modifier le lot"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? entryMode === "quick"
                ? "Utilisez cette saisie directe seulement si vous n'avez pas de réception à lier."
                : "Lier le lot à une réception est le plus simple pour retrouver l'entrée fournisseur."
              : "Mettez à jour les informations du lot et ses éventuelles anomalies."}
          </DialogDescription>
        </DialogHeader>

        {products.length === 0 ? (
          <div className="space-y-4 rounded-md border border-dashed p-4">
            <p className="text-sm font-medium">Créez d’abord un produit</p>
            <p className="text-sm text-muted-foreground">Un lot doit toujours être lié à un produit existant.</p>
            <Button asChild variant="outline">
              <Link to="/app/catalog" onClick={() => onOpenChange(false)}>
                Aller au catalogue
              </Link>
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              {mode === "create" && !fixedReceptionId ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Pour une entrée fournisseur, utilisez de préférence une réception.
                  </p>
                  <div className="inline-flex rounded-md border p-1">
                  <Button
                    type="button"
                    variant={entryMode === "attach" ? "default" : "ghost"}
                    size="sm"
                    className="h-8"
                    disabled={!canAttach}
                    onClick={() => setEntryMode("attach")}
                  >
                    Lier à une réception
                  </Button>
                  <Button
                    type="button"
                    variant={entryMode === "quick" ? "default" : "ghost"}
                    size="sm"
                    className="h-8"
                    onClick={() => setEntryMode("quick")}
                  >
                    Saisie directe
                  </Button>
                </div>
                </div>
              ) : null}

              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produit</FormLabel>
                    <FormControl>
                      <select
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                        disabled={disabled || mode === "edit"}
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
                      >
                        <option value="">Sélectionner un produit</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id} disabled={!product.isActive}>
                            {product.name}
                            {product.isActive ? "" : " (Inactif)"}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Les produits inactifs ne peuvent pas recevoir de nouveaux lots.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantityInitial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité reçue</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={disabled || mode === "edit"} min={1} step="0.01" type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode === "edit" ? (
                <div className="rounded-md border p-3 text-sm">
                  <p className="text-muted-foreground">Restant (lecture seule)</p>
                  <p className="font-medium">{defaultLot?.quantityRemaining ?? "—"}</p>
                </div>
              ) : null}

              {(entryMode === "attach" || fixedReceptionId) && mode === "create" && !fixedReceptionId ? (
                <FormField
                  control={form.control}
                  name="receptionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Réception</FormLabel>
                      <FormControl>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                          disabled={disabled || receptions.length === 0}
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value)}
                        >
                          <option value="">Sélectionner une réception</option>
                          {receptions.map((reception) => (
                            <option key={reception.id} value={reception.id}>
                              {formatReceptionLabel(reception)}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="lotCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code lot (optionnel)</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={disabled} maxLength={80} placeholder="Ex. LOT-2026-021" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de péremption (optionnel)</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={disabled} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coût unitaire (optionnel)</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={disabled} min={0} step="0.01" type="number" placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="hasIssue"
                render={({ field }) => (
                  <FormItem>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        checked={field.value}
                        disabled={disabled}
                        type="checkbox"
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                      Signaler une anomalie
                    </label>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issueNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Détail de l’anomalie (optionnel)</FormLabel>
                    <FormControl>
                      <textarea
                        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        disabled={disabled}
                        placeholder="Précisez le problème si nécessaire"
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" disabled={disabled} onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={disabled}>
                  {submitLabel}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
