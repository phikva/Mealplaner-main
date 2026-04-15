import type { SanityRecipe } from "@/types/page";

export type MealPlanCategoryOption = { _id: string; name: string };

/** Verdi i kategori-select for «kun mine favoritter» (ikke Sanity _id). */
export const MEAL_PLAN_PICKER_FAVORITES_VALUE = "__favoritter__";

export type RecipeSearchHit = {
  _id: string;
  tittel: string;
  path?: string;
  totalKcal?: number;
  totalMakros?: SanityRecipe["totalMakros"];
  imageUrl?: string | null;
};

export type ViewMode = "week" | "month" | "day";
