import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/shared/ui/page-header";

type ReceptionsHeaderProps = {
  canCreate: boolean;
  onCreate: () => void;
};

export function ReceptionsHeader({ canCreate, onCreate }: ReceptionsHeaderProps) {
  return (
    <PageHeader
      title="Réceptions"
      description="Enregistrez les entrées de stock reçues de vos fournisseurs et ouvrez ensuite le détail pour ajouter les lots."
      actions={
        canCreate ? (
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Nouvelle réception
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button disabled>
                    <Plus className="h-4 w-4" />
                    Nouvelle réception
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Créez d’abord un fournisseur</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
    />
  );
}
