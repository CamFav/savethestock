import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/shared/ui/page-header";

type SuppliersHeaderProps = {
  canManage?: boolean;
  embedded?: boolean;
  onCreate: () => void;
};

export function SuppliersHeader({ canManage = true, embedded = false, onCreate }: SuppliersHeaderProps) {
  return (
    <PageHeader
      compact={embedded}
      title={
        <div className="flex flex-wrap items-center gap-2">
          <span>Fournisseurs</span>
          {!canManage ? (
            <span className="inline-flex rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
              Consultation seule
            </span>
            ) : null}
        </div>
      }
      description={
        embedded
          ? "Référentiel des partenaires d’approvisionnement utilisés dans les réceptions."
          : "Gérez les partenaires d’approvisionnement utilisés dans les réceptions."
      }
      actions={
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onCreate} disabled={!canManage}>
                <Plus className="h-4 w-4" />
                Nouveau fournisseur
              </Button>
            </TooltipTrigger>
            <TooltipContent>{canManage ? "Ajouter un fournisseur" : "Seul le propriétaire peut modifier cette page"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      }
    />
  );
}
