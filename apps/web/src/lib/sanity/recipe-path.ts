import type { SanityRecipe } from "@/types/page";
import { slugifyPathSegment } from "@/lib/path-utils";

export const getRecipePathFromFields = (recipe: {
  _id?: string;
  slug?: { current?: string };
  tittel?: string;
}) => {
  if (recipe.slug?.current) {
    return recipe.slug.current;
  }

  if (recipe.tittel) {
    const slug = slugifyPathSegment(recipe.tittel);
    if (slug) {
      return slug;
    }
  }

  return recipe._id ?? "";
};

export const withRecipePath = <T extends SanityRecipe>(recipe: T): T => {
  return {
    ...recipe,
    path: getRecipePathFromFields(recipe),
  };
};
