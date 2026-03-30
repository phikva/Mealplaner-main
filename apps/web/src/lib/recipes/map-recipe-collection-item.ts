import { urlFor } from "@/lib/sanity/image";
import { withRecipePath } from "@/lib/sanity/recipe-path";
import type { RecipeCollectionItem } from "@/lib/recipes/recipe-filters";
import type { SanityRecipe } from "@/types/page";

export function mapSanityRecipeToCollectionItem(recipe: SanityRecipe): RecipeCollectionItem {
  const r = withRecipePath(recipe);
  return {
    _id: r._id,
    tittel: r.tittel,
    recipePath: r.path || r.slug?.current || r._id,
    imageUrl: r.image ? urlFor(r.image).width(900).height(560).fit("crop").url() : null,
    totalKcal: r.totalKcal,
    porsjoner: r.porsjoner,
    categories: r.categories,
    categoryIds: r.categoryIds,
    dietTags: r.dietTags,
    allergens: r.allergens,
    totalMakros: r.totalMakros,
  };
}
