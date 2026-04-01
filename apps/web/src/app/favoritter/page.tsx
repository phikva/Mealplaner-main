import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RecipeCollectionView } from "@/components/recipes/recipe-collection-view";
import { getArchiveFavoritesContext } from "@/lib/recipes/archive-favorites-context";
import { mapSanityRecipeToCollectionItem } from "@/lib/recipes/map-recipe-collection-item";
import { getBrukerprofilSettings } from "@/lib/sanity/brukerprofil";
import { getRecipesByIds } from "@/lib/sanity/recipes";
import { createClient } from "@/lib/supabase/server";
import type { SanityRecipe } from "@/types/page";

export const metadata: Metadata = {
  title: "Favoritter",
  description: "Dine favorittoppskrifter – samme visning som oppskriftsarkivet med søk, filter og liste eller rutenett.",
};

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logg-inn?next=/favoritter");

  const { data: rows } = await supabase
    .from("recipe_favorites")
    .select("recipe_sanity_id,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const ids = (rows ?? []).map((r) => r.recipe_sanity_id);
  const recipes = await getRecipesByIds(ids);
  const byId = new Map(recipes.map((r) => [r._id, r]));
  const ordered: SanityRecipe[] = ids.map((id) => byId.get(id)).filter((r): r is SanityRecipe => Boolean(r));

  const items = ordered.map(mapSanityRecipeToCollectionItem);
  const [brukerprofilSettings, favoritesContext] = await Promise.all([
    getBrukerprofilSettings(),
    getArchiveFavoritesContext(items.map((r) => r._id)),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="space-y-4">
        <nav
          aria-label="Brødsmuler"
          className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.02em] text-muted-foreground md:text-sm"
        >
          <Link
            href="/oppskrifter"
            className="inline-flex items-center border border-border/70 px-2 py-1 transition-colors hover:text-foreground"
          >
            Alle oppskrifter
          </Link>
          <span aria-hidden className="text-muted-foreground/70">
            →
          </span>
          <span className="inline-flex items-center border border-border/70 px-2 py-1 text-foreground">
            Favoritter
          </span>
        </nav>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Favoritter</h1>
        <p className="text-base text-muted-foreground">
          {items.length === 0
            ? "Du har ikke lagret favoritter ennå."
            : `${items.length} ${items.length === 1 ? "oppskrift" : "oppskrifter"}.`}
        </p>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Trykk «Legg til favoritt» på en oppskrift, eller gå til{" "}
          <Link href="/oppskrifter" className="font-semibold text-primary underline-offset-4 hover:underline">
            alle oppskrifter
          </Link>
          .
        </p>
      ) : (
        <RecipeCollectionView
          recipes={items}
          brukerprofilSettings={brukerprofilSettings}
          favoritesContext={favoritesContext}
        />
      )}
    </main>
  );
}
