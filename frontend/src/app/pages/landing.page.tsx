import { ArrowRight, Boxes, ClipboardCheck, PackageSearch, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type LandingFeature = {
  title: string;
  description: string;
  icon: typeof Boxes;
};

const FEATURES: LandingFeature[] = [
  {
    title: "Suivi du stock",
    description: "Voyez immédiatement ce qui est disponible.",
    icon: Boxes,
  },
  {
    title: "Réceptions et lots",
    description: "Enregistrez chaque livraison et suivez les lots.",
    icon: PackageSearch,
  },
  {
    title: "Inventaires",
    description: "Comparez stock attendu et stock réel.",
    icon: ClipboardCheck,
  },
  {
    title: "Pertes",
    description: "Déclarez simplement les produits perdus.",
    icon: TriangleAlert,
  },
];

const WORKFLOW = ["Produits", "Réceptions", "Lots", "Stock", "Inventaires / pertes"];

function DashboardMockup() {
  return (
    <div className="rounded-[32px] border border-black bg-white p-4 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.45)]">
      <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500">Aujourd'hui</p>
            <p className="mt-1 text-sm font-medium text-neutral-950">Ce qui demande votre attention</p>
          </div>
          <span className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600">Équipe</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Commande en cours</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-black">12 lignes</p>
            <p className="mt-1 text-sm text-neutral-600">Produits prêts à envoyer au fournisseur.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Stock à surveiller</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-black">4 produits</p>
            <p className="mt-1 text-sm text-neutral-600">Sous le seuil ou proches de la rupture.</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Catalogue</p>
              <p className="mt-1 text-sm font-medium text-black">Tomates pelées 5/1</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Disponible</p>
              <p className="mt-1 text-lg font-semibold text-black">8 unités</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 border-t border-neutral-200 pt-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Réception</p>
              <p className="mt-1 text-sm text-neutral-700">Lot livré le 14 mars</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Péremption</p>
              <p className="mt-1 text-sm text-neutral-700">28 mars 2026</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Action</p>
              <p className="mt-1 text-sm text-neutral-700">Ajouter à la commande</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <Link
            aria-label="Aller à l'accueil de SaveTheStock"
            className="text-lg font-semibold tracking-tight text-black"
            to="/"
          >
            SaveTheStock
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-neutral-600 md:flex" aria-label="Navigation principale">
            <a href="#product" className="transition-colors hover:text-black">
              Produit
            </a>
            <a href="#workflow" className="transition-colors hover:text-black">
              Fonctionnement
            </a>
            <a href="#pricing" className="transition-colors hover:text-black">
              Tarifs
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link to="/login">Se connecter</Link>
            </Button>
            <Button asChild size="sm" className="bg-black text-white hover:bg-neutral-800">
              <Link to="/register">Créer un compte</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <section id="product" className="grid gap-12 lg:grid-cols-[1fr_0.92fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">Gestion de stock pour la restauration</p>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.06em] text-black sm:text-6xl">
                Gérez votre stock simplement.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-neutral-600">
                Produits, réceptions, lots et pertes dans un outil clair pour votre équipe.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-black text-white hover:bg-neutral-800">
                <Link to="/register">Créer un compte</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#workflow">Voir comment ça marche</a>
              </Button>
            </div>

            <div className="grid max-w-2xl gap-3 border-t border-neutral-200 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Clarté</p>
                <p className="mt-2 text-sm leading-6 text-neutral-700">Une lecture simple de ce qu'il reste vraiment.</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Traçabilité</p>
                <p className="mt-2 text-sm leading-6 text-neutral-700">Des lots et des réceptions faciles à retrouver.</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Contrôle</p>
                <p className="mt-2 text-sm leading-6 text-neutral-700">Pertes et inventaires visibles sans détour.</p>
              </div>
            </div>
          </div>

          <DashboardMockup />
        </section>

        <section className="space-y-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">Fonctionnalités</p>
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-black">Un outil centré sur les gestes utiles</h2>
            <p className="text-base leading-7 text-neutral-600">
              L'application met l'accent sur le suivi du stock réel, les réceptions, les lots, les inventaires et les pertes.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-300 bg-white text-black">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-black">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-neutral-600">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="workflow" className="space-y-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">Workflow</p>
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-black">Un flux simple pour l'équipe</h2>
            <p className="text-base leading-7 text-neutral-600">
              L'information suit le terrain : on enregistre, on contrôle, on garde une vision fiable de ce qui est disponible.
            </p>
          </div>

          <div className="rounded-[32px] border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {WORKFLOW.map((step, index) => (
                <div key={step} className="flex items-center gap-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-white text-sm font-semibold text-black">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">{step}</p>
                  </div>
                  {index < WORKFLOW.length - 1 ? <ArrowRight className="hidden h-4 w-4 text-neutral-400 lg:block" /> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">Aperçu produit</p>
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-black">Une vision claire du stock</h2>
            <p className="text-base leading-7 text-neutral-600">
              Le produit, le lot, la réception et la quantité disponible restent alignés dans une interface simple à lire.
            </p>
          </div>

          <DashboardMockup />
        </section>

        <section id="pricing" className="border-t border-neutral-200 pt-10">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">Commencez simplement</p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-black">Un cadre clair pour suivre le stock au quotidien</h2>
              <p className="max-w-2xl text-base leading-7 text-neutral-600">
                Mettez en place votre catalogue, enregistrez vos réceptions et donnez à l'équipe un outil simple pour travailler.
              </p>
            </div>

            <Button asChild size="lg" className="bg-black text-white hover:bg-neutral-800">
              <Link to="/register">Créer un compte</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
