import {
  ArrowLeftRight,
  Boxes,
  ClipboardCheck,
  History,
  PackageCheck,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Feature = {
  title: string;
  description: string;
  icon: typeof Boxes;
};

const FEATURES: Feature[] = [
  {
    title: "Suivi du stock",
    description: "Consultez le stock en temps réel.",
    icon: Boxes,
  },
  {
    title: "Entrées et sorties",
    description: "Enregistrez les mouvements simplement.",
    icon: ArrowLeftRight,
  },
  {
    title: "Historique",
    description: "Retrouvez les actions passées.",
    icon: History,
  },
  {
    title: "Lots et DLC",
    description: "Suivez les lots et dates.",
    icon: PackageCheck,
  },
  {
    title: "Inventaires",
    description: "Comparez le réel et le prévu.",
    icon: ClipboardCheck,
  },
  {
    title: "Pertes",
    description: "Identifiez les produits perdus.",
    icon: TriangleAlert,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-neutral-200 py-5">
          <Link
            to="/"
            aria-label="Aller à l'accueil de SaveTheStock"
            className="text-base font-semibold tracking-[-0.03em] text-black"
          >
            SaveTheStock
          </Link>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="text-black hover:bg-neutral-100">
              <Link to="/login">Connexion</Link>
            </Button>
            <Button asChild size="sm" className="rounded-none border border-black bg-black text-white hover:bg-black/90">
              <Link to="/register">Créer un compte</Link>
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <section className="flex flex-1 items-center border-b border-neutral-200 py-20 sm:py-28">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-500">Gestion de stock SaaS</p>
              <h1 className="mt-6 text-5xl font-semibold tracking-[-0.08em] text-black sm:text-6xl lg:text-7xl">
                Un suivi de stock simple et clair.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
                SaveTheStock aide votre équipe à gérer les produits, les mouvements, les lots, les inventaires et les pertes.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-none border border-black bg-black px-6 text-white hover:bg-black/90">
                  <Link to="/register">Créer un compte</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-none border-black bg-white px-6 text-black hover:bg-neutral-100">
                  <Link to="/login">Connexion</Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="py-16 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-500">Fonctionnalités</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-black sm:text-4xl">
                Les fonctions essentielles, sans surcharge.
              </h2>
            </div>

            <div className="mt-10 grid gap-0 border border-neutral-200 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="border-b border-neutral-200 p-6 sm:p-8 lg:border-b-0 lg:border-r [&:nth-child(3n)]:lg:border-r-0 [&:nth-last-child(-n+3)]:lg:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r"
                  >
                    <div className="flex h-10 w-10 items-center justify-center border border-neutral-200">
                      <Icon className="h-4 w-4 text-black" />
                    </div>
                    <h3 className="mt-5 text-lg font-medium tracking-[-0.03em] text-black">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-neutral-600">{feature.description}</p>
                  </article>
                );
              })}
            </div>
          </section>
        </main>

        <footer className="flex flex-col gap-2 border-t border-neutral-200 py-6 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-black">SaveTheStock</p>
          <a href="#" className="transition-colors hover:text-black">
            Mentions légales
          </a>
        </footer>
      </div>
    </div>
  );
}
