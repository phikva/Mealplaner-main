import { sanityClient } from "@/lib/sanity/client";
import {
  recipeByPathQuery,
  recipePathsQuery,
  recipesBrowseForPickerQuery,
  recipesByIdsQuery,
  recipesSearchByTitleOptionalCategoryQuery,
  recipesSearchByTitleQuery,
} from "@/lib/sanity/queries";
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


export const getRecipesByIds = async (ids: string[]) => {
  const uniq = [...new Set(ids.filter(Boolean))];
  if (uniq.length === 0) return [];
  const rows = await sanityClient.fetch<SanityRecipe[]>(recipesByIdsQuery, { ids: uniq }, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:recipes"] },
  });
  return rows.map((r) => withRecipePath(r));
};

export const searchRecipesByTitle = async (q: string) => {
  const t = q.trim();
  if (t.length < 2) return [];
  const pattern = `*${t.replace(/\*/g, "")}*`;
  const rows = await sanityClient.fetch<SanityRecipe[]>(recipesSearchByTitleQuery, { pattern }, {
    next: { revalidate: 30, tags: ["sanity:recipes"] },
  });
  return rows.map((r) => withRecipePath(r));
};

/** Måltidsplan: søk (≥2 tegn) eller list utvalg; valgfri Sanity kategori-_id. */
export const searchOrBrowseRecipesForPicker = async (q: string, categorySanityId?: string | null) => {
  const categoryId = categorySanityId?.trim() ?? "";
  const t = q.trim();
  if (t.length >= 2) {
    const pattern = `*${t.replace(/\*/g, "")}*`;
    const rows = await sanityClient.fetch<SanityRecipe[]>(recipesSearchByTitleOptionalCategoryQuery, {
      pattern,
      categoryId,
    }, {
      next: { revalidate: 30, tags: ["sanity:recipes"] },
    });
    return rows.map((r) => withRecipePath(r));
  }
  const rows = await sanityClient.fetch<SanityRecipe[]>(recipesBrowseForPickerQuery, { categoryId }, {
    next: { revalidate: 60, tags: ["sanity:recipes"] },
  });
  return rows.map((r) => withRecipePath(r));
};
