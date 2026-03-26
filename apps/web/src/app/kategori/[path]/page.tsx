import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryTagClassName } from "@/lib/category-tags";
import { urlFor } from "@/lib/sanity/image";
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

  const recipes = await getRecipesByCategoryId(category._id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="space-y-3">
        <p className="text-base text-muted-foreground">Kategori</p>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => {
            const imageUrl = recipe.image
              ? urlFor(recipe.image).width(900).height(560).fit("crop").url()
              : null;
            const recipePath = recipe.path || recipe.slug?.current || recipe._id;

            return (
              <article
                key={recipe._id}
                className="overflow-hidden bg-background/85 transition hover:-translate-y-0.5"
              >
                <Link href={`/oppskrift/${recipePath}`} className="block">
                  <div className="aspect-video bg-muted/30">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={recipe.tittel}
                        width={900}
                        height={560}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-base text-muted-foreground">
                        Ingen bilde
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <h2 className="line-clamp-2 text-xl font-bold leading-tight">{recipe.tittel}</h2>
                    {recipe.categories && recipe.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {recipe.categories.map((item) => (
                          <span
                            key={`${recipe._id}-${item._id}`}
                            className={`px-2.5 py-1 font-sans text-[11px] font-semibold tracking-[0.02em] ${getCategoryTagClassName(item.name)}`}
                          >
                            {item.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
