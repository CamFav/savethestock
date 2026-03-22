import { ArrowRight, Check, Dot } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PRINCIPLES = ["Stock lisible", "Lots tracés", "Inventaires plus calmes"];

function ProductPreview() {
  return (
    <div className="rounded-[36px] border border-stone-300/80 bg-stone-50/90 p-4 shadow-[0_30px_80px_-52px_rgba(41,37,36,0.45)] backdrop-blur">
      <div className="rounded-[28px] border border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-5">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-400">Vue du jour</p>
            <h2 className="text-lg font-semibold tracking-[-0.04em] text-stone-950">Tableau stock</h2>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800">
            Stable
          </span>
        </div>

        <div className="grid gap-3 pt-5 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">Produit suivi</p>
            <p className="mt-3 text-xl font-semibold tracking-[-0.05em] text-stone-950">Tomates pelées 5/1</p>
            <div className="mt-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400">Disponible</p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.08em] text-stone-950">08</p>
              </div>
              <p className="max-w-[10rem] text-right text-sm leading-6 text-stone-500">
                Un stock visible sans naviguer partout.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-[24px] border border-stone-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">Lot actif</p>
              <p className="mt-2 text-sm font-medium text-stone-900">Recu le 14 mars 2026</p>
              <p className="mt-1 text-sm text-stone-500">DLC au 28 mars 2026</p>
            </div>

            <div className="rounded-[24px] border border-stone-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-400">Actions</p>
              <div className="mt-3 space-y-2 text-sm text-stone-600">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-stone-400" />
                  <span>Reception enregistree</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-stone-400" />
                  <span>Inventaire rapproche</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-stone-400" />
                  <span>Pertes identifiees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f6f1_0%,#f5f1e8_52%,#f8f6f1_100%)] text-stone-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6 sm:pb-16 lg:px-8">
        <header className="flex items-center justify-between gap-4 py-3">
          <Link
            aria-label="Aller à l'accueil de SaveTheStock"
            className="text-base font-semibold tracking-[-0.03em] text-stone-950"
            to="/"
          >
            SaveTheStock
          </Link>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost" className="text-stone-700 hover:bg-stone-200/60 hover:text-stone-950">
              <Link to="/login">Connexion</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full bg-stone-950 px-4 text-white hover:bg-stone-800">
              <Link to="/register">Essayer</Link>
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center py-10 sm:py-14">
          <section className="grid gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-stone-500">
                Gestion de stock SaaS
              </p>

              <h1 className="mt-6 text-5xl font-semibold leading-none tracking-[-0.09em] text-stone-950 sm:text-6xl lg:text-[5.25rem]">
                Moins d’ecrans.
                <br />
                Plus de calme.
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-stone-600 sm:text-lg">
                SaveTheStock rassemble produits, receptions, lots, inventaires et pertes dans un espace simple a lire.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-full bg-stone-950 px-6 text-white hover:bg-stone-800">
                  <Link to="/register">Creer un compte</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="rounded-full px-2 text-stone-700 hover:bg-transparent hover:text-stone-950"
                >
                  <Link to="/login" className="inline-flex items-center gap-2">
                    Voir l’application
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-stone-300/80 pt-5 text-sm text-stone-600">
                {PRINCIPLES.map((principle) => (
                  <span key={principle} className="inline-flex items-center gap-2">
                    <Dot className="h-4 w-4 text-stone-400" />
                    {principle}
                  </span>
                ))}
              </div>
            </div>

            <ProductPreview />
          </section>

          <section className="mt-16 border-t border-stone-300/80 pt-8 sm:mt-20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-500">L’essentiel</p>
                <p className="mt-3 text-lg leading-8 text-stone-700">
                  Une page d’accueil sobre, puis un outil métier pour suivre le stock reel sans surcharge visuelle.
                </p>
              </div>

              <Button asChild variant="outline" size="lg" className="rounded-full border-stone-300 bg-white/70 px-6 text-stone-900 hover:bg-white">
                <Link to="/register">Demarrer</Link>
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
