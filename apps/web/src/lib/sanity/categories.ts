import { sanityClient } from "@/lib/sanity/client";
import {
  categoriesQuery,
  categoryByPathQuery,
  categoryPathsQuery,
  recipesByCategoryIdQuery,
} from "@/lib/sanity/queries";
import { getCategoryPathFromFields, withCategoryPath } from "@/lib/sanity/category-path";
import { withRecipePath } from "@/lib/sanity/recipe-path";
import type { SanityCategory, SanityRecipe } from "@/types/page";

const SANITY_REVALIDATE_SECONDS = 60;

export const getCategoryByPath = async (path: string) => {
  const category = await sanityClient.fetch<SanityCategory | null>(categoryByPathQuery, { path }, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:categories"] },
  });

  if (category) {
    return withCategoryPath(category);
  }

  const pathCandidates = await sanityClient.fetch<Array<{ _id: string; name: string; slug?: { current?: string } }>>(
    categoryPathsQuery,
    {},
    {
      next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:categories"] },
    },
  );

  const matched = pathCandidates.find((candidate) => getCategoryPathFromFields(candidate) === path);
  if (!matched?._id) {
    return null;
  }

  const byIdCategory = await sanityClient.fetch<SanityCategory | null>(categoryByPathQuery, { path: matched._id }, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:categories"] },
  });

  return byIdCategory ? withCategoryPath(byIdCategory) : null;
};

export const getCategories = async () => {
  const categories = await sanityClient.fetch<SanityCategory[]>(categoriesQuery, {}, {
    next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:categories"] },
  });

  return categories.map(withCategoryPath);
};

export const getCategoryPaths = async () => {
  const categories = await sanityClient.fetch<Array<{ _id: string; name: string; slug?: { current?: string } }>>(
    categoryPathsQuery,
    {},
    {
      next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:categories"] },
    },
  );

  return categories.map((category) => ({
    path: getCategoryPathFromFields(category),
  }));
};

export const getRecipesByCategoryId = async (categoryId: string) => {
  const recipes = await sanityClient.fetch<SanityRecipe[]>(
    recipesByCategoryIdQuery,
    { categoryId },
    {
      next: { revalidate: SANITY_REVALIDATE_SECONDS, tags: ["sanity:recipes", "sanity:categories"] },
    },
  );

  return recipes.map(withRecipePath);
};
