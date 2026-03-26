import type { Metadata } from "next";
import { CategoryArchiveView } from "@/app/kategori/category-archive-view";
import { getCategories, getRecipesByCategoryId } from "@/lib/sanity/categories";
import { urlFor } from "@/lib/sanity/image";

export const metadata: Metadata = {
  title: "Kategorier",
  description: "Utforsk alle oppskriftskategorier.",
};

export default async function CategoryArchivePage() {
  const categories = await getCategories();

  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const recipes = await getRecipesByCategoryId(category._id);
      const categoryPath = category.slug?.current || category.path;
      if (!categoryPath) {
        return null;
      }
      return {
        _id: category._id,
        name: category.name,
        path: categoryPath,
        count: recipes.length,
        imageUrl: category.image
          ? urlFor(category.image).width(1000).height(650).fit("crop").url()
          : null,
      };
    }),
  );
  const visibleCategories = categoriesWithCounts.filter(
    (category): category is NonNullable<typeof category> => Boolean(category),
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Alle kategorier</h1>
        <p className="text-base text-muted-foreground">
          Velg en kategori for å se oppskrifter samlet på ett sted.
        </p>
      </header>

      {visibleCategories.length === 0 ? (
        <p className="bg-card/45 p-6 text-muted-foreground">Ingen kategorier funnet ennå.</p>
      ) : (
        <CategoryArchiveView categories={visibleCategories} />
      )}
    </main>
  );
}
