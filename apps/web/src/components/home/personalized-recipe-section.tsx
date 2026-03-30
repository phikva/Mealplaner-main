"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { urlFor } from "@/lib/sanity/image";
import type { SanityCategory, SanityContentIndex, SanityRecipe } from "@/types/page";

type ProfileRow = {
  kitchen_category_ids?: string[] | null;
};

type Props = {
  contentIndex: SanityContentIndex;
};

export function PersonalizedRecipeSection({ contentIndex }: Props) {
  const [kitchenCategoryIds, setKitchenCategoryIds] = useState<string[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setKitchenCategoryIds([]);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("kitchen_category_ids")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>();

      if (cancelled) return;
      setKitchenCategoryIds(data?.kitchen_category_ids ?? []);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const carousels = useMemo(() => {
    if (!kitchenCategoryIds) return null;
    if (kitchenCategoryIds.length === 0) return [];

    const categoriesById = new Map<string, SanityCategory>(
      contentIndex.categories.map((c) => [c._id, c]),
    );

    return kitchenCategoryIds
      .map((id) => {
        const category = categoriesById.get(id);
        if (!category) return null;

        const recipes = contentIndex.recipes
          .filter((r) => r.categoryIds?.includes(id))
          .slice(0, 2);

        if (recipes.length === 0) return null;

        return { category, recipes };
      })
      .filter(Boolean) as Array<{ category: SanityCategory; recipes: SanityRecipe[] }>;
  }, [contentIndex.categories, contentIndex.recipes, kitchenCategoryIds]);

  if (carousels === null) {
    return null;
  }

  if (carousels.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6 py-4 md:py-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">For deg</h2>
        <p className="text-base text-muted-foreground">
          Anbefalinger basert på preferansene dine.
        </p>
      </div>

      <div className="space-y-10">
        {carousels.map(({ category, recipes }) => {
          const categoryPath = category.path ?? category.slug?.current ?? category._id;
          return (
            <div key={category._id} className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold tracking-[0.06em] text-muted-foreground">
                    Basert på
                  </p>
                  <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    {category.name}
                  </h3>
                </div>
                <Link
                  href={`/kategori/${categoryPath}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 px-5 py-2.5 text-sm font-semibold tracking-[0.02em] text-foreground transition-colors hover:bg-muted/40"
                >
                  Se alle
                  <span aria-hidden>→</span>
                </Link>
              </div>

              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
                {recipes.map((recipe) => (
                  <PersonalRecipeCard key={recipe._id} recipe={recipe} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PersonalRecipeCard({ recipe }: { recipe: SanityRecipe }) {
  const imageUrl = recipe.image
    ? urlFor(recipe.image).width(800).height(500).fit("crop").url()
    : null;
  const recipePath = recipe.path || recipe.slug?.current || recipe._id;
  const href = `/oppskrift/${recipePath}`;

  return (
    <article className="min-w-[260px] snap-start overflow-hidden bg-background/85 transition duration-300 hover:-translate-y-0.5 sm:min-w-[320px]">
      <Link href={href} className="block">
        <div className="relative aspect-video bg-muted/30">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={recipe.tittel}
              width={800}
              height={500}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Ingen bilde
            </div>
          )}
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <Link href={href} className="block">
          <h4 className="line-clamp-2 text-lg font-bold leading-tight">{recipe.tittel}</h4>
        </Link>
        {(typeof recipe.totalKcal === "number" || typeof recipe.porsjoner === "number") ? (
          <div className="flex flex-wrap gap-2">
            {typeof recipe.totalKcal === "number" ? (
              <span className="border border-border/70 bg-secondary px-2 py-0.5 font-sans text-[10px] font-semibold tracking-[0.02em]">
                {Math.round(recipe.totalKcal)} kcal
              </span>
            ) : null}
            {typeof recipe.porsjoner === "number" ? (
              <span className="border border-border/70 bg-secondary px-2 py-0.5 font-sans text-[10px] font-semibold tracking-[0.02em]">
                {recipe.porsjoner} porsjoner
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

