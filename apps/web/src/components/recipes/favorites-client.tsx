"use client";

import Link from "next/link";
import { RecipeCollectionView } from "@/components/recipes/recipe-collection-view";
import { useFavoritesPage } from "@/lib/query/favorites";

export function FavoritesClient() {
  const { data, isPending, isError } = useFavoritesPage();

  if (isPending && !data) {
    return <p className="text-base text-muted-foreground">Laster favoritter …</p>;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-destructive">
        Kunne ikke laste favoritter. Prøv å laste siden på nytt.
      </p>
    );
  }

  const { recipes, brukerprofilSettings, favoritesContext } = data;

  return (
    <>
      <p className="text-base text-muted-foreground">
        {recipes.length === 0
          ? "Du har ikke lagret favoritter ennå."
          : `${recipes.length} ${recipes.length === 1 ? "oppskrift" : "oppskrifter"}.`}
      </p>

      {recipes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Trykk «Legg til favoritt» på en oppskrift, eller gå til{" "}
          <Link href="/oppskrifter" prefetch className="font-semibold text-primary underline-offset-4 hover:underline">
            alle oppskrifter
          </Link>
          .
        </p>
      ) : (
        <RecipeCollectionView
          recipes={recipes}
          brukerprofilSettings={brukerprofilSettings}
          favoritesContext={favoritesContext}
        />
      )}
    </>
  );
}
