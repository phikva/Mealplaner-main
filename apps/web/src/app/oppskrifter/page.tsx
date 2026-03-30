import type { Metadata } from "next";
import Link from "next/link";
import { RecipeCollectionView } from "@/components/recipes/recipe-collection-view";
import { getBrukerprofilSettings } from "@/lib/sanity/brukerprofil";
import { getRecipesForArchive } from "@/lib/sanity/content";
import { mapSanityRecipeToCollectionItem } from "@/lib/recipes/map-recipe-collection-item";

export const metadata: Metadata = {
  title: "Alle oppskrifter",
  description:
    "Søk i alle oppskrifter og filtrer på kosthold, allergener, kalorier og makronæringsstoffer.",
};

export default async function OppskrifterArchivePage() {
  const [recipes, brukerprofilSettings] = await Promise.all([
    getRecipesForArchive(),
    getBrukerprofilSettings(),
  ]);

  const items = recipes.map(mapSanityRecipeToCollectionItem);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="space-y-4">
        <nav
          aria-label="Brødsmuler"
          className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.02em] text-muted-foreground md:text-sm"
        >
          <Link
            href="/kategori"
            className="inline-flex items-center border border-border/70 px-2 py-1 transition-colors hover:text-foreground"
          >
            Kategorier
          </Link>
          <span aria-hidden className="text-muted-foreground/70">
            →
          </span>
          <span className="inline-flex items-center border border-border/70 px-2 py-1 text-foreground">
            Alle oppskrifter
          </span>
        </nav>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Alle oppskrifter</h1>
        <p className="text-base text-muted-foreground">
          {recipes.length} {recipes.length === 1 ? "oppskrift" : "oppskrifter"}.
        </p>
      </header>

      {recipes.length === 0 ? (
        <p className="bg-card/45 p-6 text-muted-foreground">Ingen oppskrifter er publisert ennå.</p>
      ) : (
        <RecipeCollectionView recipes={items} brukerprofilSettings={brukerprofilSettings} />
      )}
    </main>
  );
}
