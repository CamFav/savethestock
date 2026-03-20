import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageHeader } from "@/shared/ui/page-header";

type ProductsHeaderProps = {
  canCreate: boolean;
  canManage?: boolean;
  embedded?: boolean;
  onCreate: () => void;
};

export function ProductsHeader({ canCreate, canManage = true, embedded = false, onCreate }: ProductsHeaderProps) {
  return (
    <PageHeader
      compact={embedded}
      title={
        <div className="flex flex-wrap items-center gap-2">
          <span>Produits</span>
          {!canManage ? (
            <span className="inline-flex rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
              Lecture seule
            </span>
          ) : null}
        </div>
      }
      description={
        embedded
          ? "Gestion du référentiel produit utilisé dans le stock, les pertes et les réceptions."
          : "Gérez le référentiel des produits et leurs seuils d’alerte."
      }
      actions={
        canManage && canCreate ? (
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Nouveau produit
          </Button>
        ) : canManage ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button disabled>
                    <Plus className="h-4 w-4" />
                    Nouveau produit
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Créez d’abord une catégorie</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button disabled>
                    <Plus className="h-4 w-4" />
                    Nouveau produit
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Modification réservée aux owners</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
    />
  );
}
