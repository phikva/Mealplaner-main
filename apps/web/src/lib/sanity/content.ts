import { sanityClient } from "@/lib/sanity/client";
import {
  categoriesQuery,
  recipesListBatchQuery,
  recipesQuery,
  tiersQuery,
} from "@/lib/sanity/queries";
import { withRecipePath } from "@/lib/sanity/recipe-path";
import type {
  SanityCategory,
  SanityContentIndex,
  SanityRecipe,
  SanityTier,
} from "@/types/page";

const SANITY_REVALIDATE_SECONDS = 60;
const RECIPES_ARCHIVE_BATCH = 500;

/** Recipes for archive page — slim payload, no ingredients; fetches all pages. */
export const getRecipesForArchive = async (): Promise<SanityRecipe[]> => {
  const fetchOpts = {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:recipes"] as string[] },
  };

  const all: SanityRecipe[] = [];
  let start = 0;
  for (;;) {
    const end = start + RECIPES_ARCHIVE_BATCH;
    const batch = await sanityClient.fetch<SanityRecipe[]>(
      recipesListBatchQuery,
      { start, end },
      fetchOpts,
    );
    all.push(...batch);
    if (batch.length < RECIPES_ARCHIVE_BATCH) {
      break;
    }
    start = end;
  }

  return all.map(withRecipePath);
};

export const getSanityContentIndex = async (): Promise<SanityContentIndex> => {
  const [recipes, categories, tiers] = await Promise.all([
    sanityClient.fetch<SanityRecipe[]>(recipesQuery, {}, {
      next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:recipes"] },
    }),
    sanityClient.fetch<SanityCategory[]>(categoriesQuery, {}, {
      next: {
        revalidate: SANITY_REVALIDATE_SECONDS,
        tags: ["sanity:categories"],
      },
    }),
    sanityClient.fetch<SanityTier[]>(tiersQuery, {}, {
      next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:tiers"] },
    }),
  ]);

  return {
    recipes: recipes.map(withRecipePath),
    categories,
    tiers,
  };
};
