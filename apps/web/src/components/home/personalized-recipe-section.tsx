"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getCategoryHref, getCategoryTagClassName } from "@/lib/category-tags";
import { createClient } from "@/lib/supabase/client";
import { urlFor } from "@/lib/sanity/image";
import type { SanityContentIndex, SanityRecipe } from "@/types/page";

type ProfileRow = {
  kitchen_category_ids?: string[] | null;
  diet_values?: string[] | null;
  allergies?: string[] | null;
};

type Props = {
  contentIndex: SanityContentIndex;
};

export function PersonalizedRecipeSection({ contentIndex }: Props) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setProfile({ kitchen_category_ids: [], diet_values: [], allergies: [] });
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("kitchen_category_ids,diet_values,allergies")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>();

      if (cancelled) return;
      setProfile({
        kitchen_category_ids: data?.kitchen_category_ids ?? [],
        diet_values: data?.diet_values ?? [],
        allergies: data?.allergies ?? [],
      });
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const result = useMemo(() => {
    if (!profile) return null;

    const kitchenCategoryIds = profile.kitchen_category_ids ?? [];
    const dietValues = profile.diet_values ?? [];
    const excludedAllergens = new Set((profile.allergies ?? []).map((a) => a.toLowerCase()));
    const hasSignals = kitchenCategoryIds.length > 0 || dietValues.length > 0;

    const blocks: SanityRecipe[] = [];
    const seen = new Set<string>();

    const isAllowed = (r: SanityRecipe) => {
      const allergens = (r.allergens ?? []).map((a) => a.toLowerCase());
      return allergens.every((a) => !excludedAllergens.has(a));
    };

    const score = (r: SanityRecipe) => {
      if (!dietValues.length) return 0;
      const tags = new Set(r.dietTags ?? []);
      return dietValues.reduce((acc, v) => (tags.has(v) ? acc + 1 : acc), 0);
    };

    const addTop = (candidates: SanityRecipe[], count: number) => {
      const sorted = [...candidates].sort((a, b) => score(b) - score(a));
      for (const r of sorted) {
        if (blocks.length >= 32) break;
        if (seen.has(r._id)) continue;
        if (!isAllowed(r)) continue;
        blocks.push(r);
        seen.add(r._id);
        if (count > 0) count -= 1;
        if (count === 0) break;
      }
    };

    if (hasSignals) {
      // 2 per kitchen/preference (category)
      kitchenCategoryIds.forEach((catId) => {
        const candidates = contentIndex.recipes.filter((r) => r.categoryIds?.includes(catId));
        addTop(candidates, 2);
      });

      // 2 per diet tag
      dietValues.forEach((diet) => {
        const candidates = contentIndex.recipes.filter((r) => (r.dietTags ?? []).includes(diet));
        addTop(candidates, 2);
      });

      // Fill a little extra (still respecting allergies)
      addTop(contentIndex.recipes, 8);
      return { recipes: blocks, personalized: true };
    }

    // No preferences set → show random (still respecting allergies).
    const candidates = contentIndex.recipes.filter(isAllowed);
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    return { recipes: shuffled.slice(0, 12), personalized: false };
  }, [contentIndex.recipes, profile]);

  if (result === null) {
    return null;
  }

  if (result.recipes.length === 0) {
    return null;
  }

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) {
      return;
    }
    const amount = Math.round(carouselRef.current.clientWidth * 0.8);
    carouselRef.current.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-6 py-4 md:py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">For deg</h2>
          <p className="text-base text-muted-foreground">
            {result.personalized
              ? "Anbefalinger basert på preferansene dine."
              : "Tilfeldige oppskrifter. Sett opp preferanser for bedre treff."}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          {!result.personalized ? (
            <Link
              href="/profil"
              className="mr-2 hidden items-center justify-center rounded-full border border-border/70 px-5 py-2.5 text-sm font-semibold tracking-[0.02em] text-foreground transition-colors hover:bg-muted/40 md:inline-flex"
            >
              Sett opp preferanser
              <span aria-hidden>→</span>
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => scrollCarousel("left")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-white text-lg text-foreground transition-colors hover:bg-white/90"
            aria-label="Scroll karusell til venstre"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollCarousel("right")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-white text-lg text-foreground transition-colors hover:bg-white/90"
            aria-label="Scroll karusell til høyre"
          >
            →
          </button>
        </div>
      </div>

      <div ref={carouselRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {result.recipes.map((recipe) => (
          <PersonalRecipeCard key={recipe._id} recipe={recipe} />
        ))}
      </div>

      {!result.personalized ? (
        <Link
          href="/profil"
          className="inline-flex w-full items-center justify-center rounded-lg border border-border/70 bg-background px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted md:hidden"
        >
          Sett opp preferanser
          <span aria-hidden>→</span>
        </Link>
      ) : null}
    </section>
  );
}

function PersonalRecipeCard({ recipe }: { recipe: SanityRecipe }) {
  const pathname = usePathname();
  const imageUrl = recipe.image
    ? urlFor(recipe.image).width(800).height(500).fit("crop").url()
    : null;
  const recipePath = recipe.path || recipe.slug?.current || recipe._id;
  const recipeHref = (() => {
    if (!pathname) {
      return `/oppskrift/${recipePath}`;
    }
    const params = new URLSearchParams({ from: pathname });
    return `/oppskrift/${recipePath}?${params.toString()}`;
  })();

  return (
    <article className="min-w-[260px] snap-start overflow-hidden bg-background/85 transition duration-300 hover:-translate-y-0.5 sm:min-w-[320px]">
      <Link href={recipeHref} className="block">
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
          {(typeof recipe.totalKcal === "number" || typeof recipe.porsjoner === "number") ? (
            <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
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
      </Link>
      <div className="space-y-2 p-4">
        <Link href={recipeHref} className="block">
          <h4 className="line-clamp-2 text-lg font-bold leading-tight">{recipe.tittel}</h4>
        </Link>
        {recipe.categories && recipe.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {recipe.categories.map((category) => (
              <Link
                key={`${recipe._id}-${category._id}`}
                href={getCategoryHref(category)}
                className={`rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold tracking-[0.02em] hover:bg-muted/40 ${getCategoryTagClassName(category.name)}`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

