import type { LucideIcon } from "lucide-react";
import { Boxes, ClipboardList, ChartColumn, Settings, ShoppingCart, Sun, Trash2, Truck } from "lucide-react";
import { isOwnerRole } from "@/shared/auth/roles";

export type AppNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  description: string;
};

const baseNavItems: AppNavItem[] = [
  {
    label: "Aujourd'hui",
    to: "/app/today",
    icon: Sun,
    description: "Voir ce qui demande une action maintenant.",
  },
  {
    label: "Catalogue",
    to: "/app/catalog",
    icon: Boxes,
    description: "Consulter les produits et preparer les besoins.",
  },
  {
    label: "Fournisseurs",
    to: "/app/suppliers",
    icon: Truck,
    description: "Organiser les achats et les partenaires.",
  },
  {
    label: "Commandes",
    to: "/app/orders",
    icon: ShoppingCart,
    description: "Preparer les achats avant les receptions.",
  },
  {
    label: "Inventaires",
    to: "/app/inventories",
    icon: ClipboardList,
    description: "Compter et corriger le stock.",
  },
  {
    label: "Pertes",
    to: "/app/waste-sessions",
    icon: Trash2,
    description: "Declarer les produits perdus.",
  },
];

const ownerNavItems: AppNavItem[] = [
  {
    label: "Analyses",
    to: "/app/analyses",
    icon: ChartColumn,
    description: "Suivre les resultats et les tendances.",
  },
  {
    label: "Paramètres",
    to: "/app/settings",
    icon: Settings,
    description: "Gerer l'equipe et les reglages.",
  },
];

export function getAppNavItems(role: string | null | undefined): AppNavItem[] {
  if (isOwnerRole(role)) {
    return [...baseNavItems, ...ownerNavItems];
  }

  return baseNavItems;
}
