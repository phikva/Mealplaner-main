import { sanityClient } from "@/lib/sanity/client";
import {
  categoriesQuery,
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
