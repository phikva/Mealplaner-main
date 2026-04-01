import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeCollectionView } from "@/components/recipes/recipe-collection-view";
import { getArchiveFavoritesContext } from "@/lib/recipes/archive-favorites-context";
import { mapSanityRecipeToCollectionItem } from "@/lib/recipes/map-recipe-collection-item";
import { getBrukerprofilSettings } from "@/lib/sanity/brukerprofil";
import {
  getCategoryByPath,
  getCategoryPaths,
  getRecipesByCategoryId,
} from "@/lib/sanity/categories";

type PageProps = {
  params: Promise<{ path: string }>;
};

export async function generateStaticParams() {
  const paths = await getCategoryPaths();
  return paths.filter((item) => item.path);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { path } = await params;
  const category = await getCategoryByPath(path);

  if (!category) {
    return {
      title: "Kategori finnes ikke",
      description: "Denne kategorien er ikke tilgjengelig.",
    };
  }

  return {
    title: `Kategori: ${category.name}`,
    description: `Oppskrifter i kategorien ${category.name}.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { path } = await params;
  const category = await getCategoryByPath(path);

  if (!category) {
    notFound();
  }

  const [recipes, brukerprofilSettings] = await Promise.all([
    getRecipesByCategoryId(category._id),
    getBrukerprofilSettings(),
  ]);
  const recipeItems = recipes.map(mapSanityRecipeToCollectionItem);
  const favoritesContext = await getArchiveFavoritesContext(recipeItems.map((r) => r._id));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="space-y-4">
        <nav aria-label="Brødsmuler" className="flex items-center gap-2 text-xs font-semibold tracking-[0.02em] text-muted-foreground md:text-sm">
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
            {category.name}
          </span>
        </nav>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{category.name}</h1>
        <p className="text-base text-muted-foreground">
          {recipes.length} {recipes.length === 1 ? "oppskrift" : "oppskrifter"}
        </p>
      </header>

      {recipes.length === 0 ? (
        <p className="bg-card/45 p-6 text-muted-foreground">
          Ingen oppskrifter funnet i denne kategorien ennå.
        </p>
      ) : (
        <RecipeCollectionView
          recipes={recipeItems}
          brukerprofilSettings={brukerprofilSettings}
          favoritesContext={favoritesContext}
          hideCategoryFilter
        />
      )}
    </main>
  );
}
