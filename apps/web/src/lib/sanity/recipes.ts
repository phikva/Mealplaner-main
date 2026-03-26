import { sanityClient } from "@/lib/sanity/client";
import { recipeByPathQuery, recipePathsQuery } from "@/lib/sanity/queries";
import type { SanityRecipe } from "@/types/page";

const SANITY_REVALIDATE_SECONDS = 60;

export const getRecipeByPath = async (path: string) => {
  return sanityClient.fetch<SanityRecipe | null>(recipeByPathQuery, { path }, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:recipes"] },
  });
};

export const getRecipePaths = async () => {
  return sanityClient.fetch<Array<{ path: string }>>(recipePathsQuery, {}, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:recipes"] },
  });
};
