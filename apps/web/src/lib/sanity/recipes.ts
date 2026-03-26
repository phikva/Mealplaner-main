import { sanityClient } from "@/lib/sanity/client";
import { recipeByPathQuery, recipePathsQuery } from "@/lib/sanity/queries";
import { getRecipePathFromFields, withRecipePath } from "@/lib/sanity/recipe-path";
import type { SanityRecipe } from "@/types/page";

const SANITY_REVALIDATE_SECONDS = 60;

export const getRecipeByPath = async (path: string) => {
  const recipe = await sanityClient.fetch<SanityRecipe | null>(recipeByPathQuery, { path }, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:recipes"] },
  });

  if (recipe) {
    return withRecipePath(recipe);
  }

  const pathCandidates = await sanityClient.fetch<Array<{ _id: string; tittel: string; slug?: { current?: string } }>>(
    recipePathsQuery,
    {},
    {
      next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:recipes"] },
    },
  );

  const matched = pathCandidates.find((candidate) => getRecipePathFromFields(candidate) === path);
  if (!matched?._id) {
    return null;
  }

  const byIdRecipe = await sanityClient.fetch<SanityRecipe | null>(recipeByPathQuery, { path: matched._id }, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:recipes"] },
  });

  return byIdRecipe ? withRecipePath(byIdRecipe) : null;
};

export const getRecipePaths = async () => {
  const recipes = await sanityClient.fetch<Array<{ _id: string; tittel: string; slug?: { current?: string } }>>(
    recipePathsQuery,
    {},
    {
      next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:recipes"] },
    },
  );

  return recipes.map((recipe) => ({
    path: getRecipePathFromFields(recipe),
  }));
};
