import { sanityClient } from "@/lib/sanity/client";
import {
  categoryByPathQuery,
  categoryPathsQuery,
  recipesByCategoryIdQuery,
} from "@/lib/sanity/queries";
import type { SanityCategory, SanityRecipe } from "@/types/page";

const SANITY_REVALIDATE_SECONDS = 60;

export const getCategoryByPath = async (path: string) => {
  return sanityClient.fetch<SanityCategory | null>(categoryByPathQuery, { path }, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:categories"] },
  });
};

export const getCategoryPaths = async () => {
  return sanityClient.fetch<Array<{ path: string }>>(categoryPathsQuery, {}, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:categories"] },
  });
};

export const getRecipesByCategoryId = async (categoryId: string) => {
  return sanityClient.fetch<SanityRecipe[]>(
    recipesByCategoryIdQuery,
    { categoryId },
    {
      next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:recipes", "sanity:categories"] },
    },
  );
};
