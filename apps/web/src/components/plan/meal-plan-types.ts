import type { SanityRecipe } from "@/types/page";

export type MealPlanCategoryOption = { _id: string; name: string };

export type RecipeSearchHit = {
  _id: string;
  tittel: string;
  path?: string;
  totalKcal?: number;
  totalMakros?: SanityRecipe["totalMakros"];
  imageUrl?: string | null;
};

export type ViewMode = "week" | "month" | "day";
