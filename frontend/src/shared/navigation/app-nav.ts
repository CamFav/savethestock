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
    description: "Consulter les produits et préparer les besoins.",
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
    description: "Préparer les achats avant les réceptions.",
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
    description: "Déclarer les produits perdus.",
  },
];

const ownerNavItems: AppNavItem[] = [
  {
    label: "Analyses",
    to: "/app/analyses",
    icon: ChartColumn,
    description: "Suivre les résultats et les tendances.",
  },
  {
    label: "Paramètres",
    to: "/app/settings",
    icon: Settings,
    description: "Gérer l'équipe et les réglages.",
  },
];

export function getAppNavItems(role: string | null | undefined): AppNavItem[] {
  if (isOwnerRole(role)) {
    return [...baseNavItems, ...ownerNavItems];
  }

  return baseNavItems;
}
