import type { MealPlanRow } from "@/app/actions/meal-plan";
import { endOfMonth, localYmd, startOfMonth } from "@/components/plan/meal-plan-dates";
import type { SanityRecipe } from "@/types/page";

export type MealPlanBundle = {
  entries: MealPlanRow[];
  recipes: SanityRecipe[];
};

export function mealPlanRangeKey(from: string, to: string) {
  return `${from}:${to}`;
}

export function monthRangeForAnchor(anchor: Date) {
  const from = localYmd(startOfMonth(anchor));
  const to = localYmd(endOfMonth(anchor));
  return { from, to };
}

export function isRangeWithin(
  outer: { from: string; to: string },
  inner: { from: string; to: string },
) {
  return outer.from <= inner.from && outer.to >= inner.to;
}

export function filterMealPlanBundle(
  bundle: MealPlanBundle,
  from: string,
  to: string,
): MealPlanBundle {
  const entries = bundle.entries.filter((e) => e.plan_date >= from && e.plan_date <= to);
  const usedIds = new Set(entries.map((e) => e.recipe_sanity_id));
  const recipes = bundle.recipes.filter((r) => usedIds.has(r._id));
  return { entries, recipes };
}
