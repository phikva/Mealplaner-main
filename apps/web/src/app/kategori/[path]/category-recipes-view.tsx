"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { getCategoryHref, getCategoryTagClassName } from "@/lib/category-tags";
import type { SanityRecipe } from "@/types/page";

type Props = {
  recipes: Array<{
    _id: string;
    tittel: string;
    recipePath: string;
    imageUrl: string | null;
    totalKcal?: number;
    porsjoner?: number;
    categories?: SanityRecipe["categories"];
  }>;
};

export const CategoryRecipesView = ({ recipes }: Props) => {
  const [view, setView] = useState<"grid" | "list">("grid");
  const pathname = usePathname();
  const fromCategory = pathname?.startsWith("/kategori/") ? pathname.split("/")[2] : undefined;

  const getRecipeHref = (recipePath: string) => {
    if (!pathname) {
      return `/oppskrift/${recipePath}`;
    }
    const params = new URLSearchParams({ from: pathname });
    if (fromCategory) {
      params.set("fromCategory", fromCategory);
    }
    return `/oppskrift/${recipePath}?${params.toString()}`;
  };

  return (
    <section className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-end">
        <div className="inline-flex border border-border/70 bg-background/85 p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`px-3 py-1.5 text-xs font-semibold tracking-[0.02em] md:text-sm ${
              view === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            Grid
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`px-3 py-1.5 text-xs font-semibold tracking-[0.02em] md:text-sm ${
              view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            Liste
          </button>
        </div>
      </div>

      <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
        {recipes.map((recipe) => (
          <article
            key={recipe._id}
            className={`overflow-hidden bg-background/85 transition hover:-translate-y-0.5 ${
              view === "list"
                ? "grid grid-cols-[112px_1fr] gap-0 border-b border-border/60 pb-2 last:border-b-0 md:grid-cols-[180px_1fr]"
                : ""
            }`}
          >
            <Link href={getRecipeHref(recipe.recipePath)} className="block">
              <div
                className={
                  view === "grid"
                    ? "relative aspect-video bg-muted/30"
                    : "relative h-full min-h-[100px] bg-muted/30 md:min-h-[120px]"
                }
              >
                {recipe.imageUrl ? (
                  <Image
                    src={recipe.imageUrl}
                    alt={recipe.tittel}
                    width={900}
                    height={560}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground md:text-sm">
                    Ingen bilde
                  </div>
                )}
                {(typeof recipe.totalKcal === "number" || typeof recipe.porsjoner === "number") ? (
                  <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
                    {typeof recipe.totalKcal === "number" ? (
                      <span
                        className={`border border-border/70 bg-secondary font-sans font-semibold tracking-[0.02em] ${
                          view === "list" ? "px-1.5 py-0 text-[9px] md:px-2 md:py-0.5 md:text-[10px]" : "px-2 py-0.5 text-[10px]"
                        }`}
                      >
                        {Math.round(recipe.totalKcal)} kcal
                      </span>
                    ) : null}
                    {typeof recipe.porsjoner === "number" ? (
                      <span
                        className={`border border-border/70 bg-secondary font-sans font-semibold tracking-[0.02em] ${
                          view === "list" ? "px-1.5 py-0 text-[9px] md:px-2 md:py-0.5 md:text-[10px]" : "px-2 py-0.5 text-[10px]"
                        }`}
                      >
                        {recipe.porsjoner} porsjoner
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </Link>

            <div className={view === "grid" ? "space-y-3 p-4" : "space-y-2 p-3 md:p-4"}>
              <Link href={getRecipeHref(recipe.recipePath)} className="block">
                <h2 className={view === "grid" ? "line-clamp-2 text-xl font-bold leading-tight" : "line-clamp-2 text-base font-bold leading-tight md:text-lg"}>
                  {recipe.tittel}
                </h2>
              </Link>
              {recipe.categories && recipe.categories.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {recipe.categories.map((item) => (
                    <Link
                      key={`${recipe._id}-${item._id}`}
                      href={getCategoryHref(item)}
                      className={`rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold tracking-[0.02em] ${getCategoryTagClassName(item.name)}`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
