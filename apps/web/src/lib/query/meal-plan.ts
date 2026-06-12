"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getMealPlanWithRecipesAction } from "@/app/actions/meal-plan";
import {
  filterMealPlanBundle,
  isRangeWithin,
  mealPlanRangeKey,
  monthRangeForAnchor,
  type MealPlanBundle,
} from "@/components/plan/meal-plan-cache";
import { addMonthsInPlanTz } from "@/components/plan/meal-plan-dates";

export const mealPlanKeys = {
  all: ["meal-plan"] as const,
  month: (from: string, to: string) => [...mealPlanKeys.all, "month", from, to] as const,
  range: (from: string, to: string) => [...mealPlanKeys.all, "range", from, to] as const,
};

export async function fetchMealPlanBundle(from: string, to: string): Promise<MealPlanBundle> {
  const res = await getMealPlanWithRecipesAction(from, to);
  if (!res.ok) {
    throw new Error(res.error);
  }
  return { entries: res.entries, recipes: res.recipes };
}

export function useMealPlanMonth(anchor: Date, initialMonth?: MealPlanBundle & { from: string; to: string }) {
  const month = monthRangeForAnchor(anchor);
  const seed =
    initialMonth &&
    initialMonth.from === month.from &&
    initialMonth.to === month.to
      ? { entries: initialMonth.entries, recipes: initialMonth.recipes }
      : undefined;

  return useQuery({
    queryKey: mealPlanKeys.month(month.from, month.to),
    queryFn: () => fetchMealPlanBundle(month.from, month.to),
    initialData: seed,
    staleTime: 5 * 60_000,
  });
}

export function useMealPlanRange(
  range: { from: string; to: string },
  monthBounds: { from: string; to: string },
) {
  const withinMonth = isRangeWithin(monthBounds, range);

  return useQuery({
    queryKey: mealPlanKeys.range(range.from, range.to),
    queryFn: () => fetchMealPlanBundle(range.from, range.to),
    enabled: !withinMonth,
    staleTime: 5 * 60_000,
  });
}

export function useVisibleMealPlanBundle(
  range: { from: string; to: string },
  monthBounds: { from: string; to: string },
  monthBundle: MealPlanBundle | undefined,
  rangeBundle: MealPlanBundle | undefined,
): MealPlanBundle {
  if (monthBundle && isRangeWithin(monthBounds, range)) {
    return filterMealPlanBundle(monthBundle, range.from, range.to);
  }
  return rangeBundle ?? { entries: [], recipes: [] };
}

export function usePrefetchAdjacentMealPlanMonths(anchor: Date) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const id = window.setTimeout(() => {
      for (const offset of [-1, 1] as const) {
        const month = monthRangeForAnchor(addMonthsInPlanTz(anchor, offset));
        void queryClient.prefetchQuery({
          queryKey: mealPlanKeys.month(month.from, month.to),
          queryFn: () => fetchMealPlanBundle(month.from, month.to),
          staleTime: 5 * 60_000,
        });
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [anchor, queryClient]);
}

export function useInvalidateMealPlan() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: mealPlanKeys.all });
}

/** Seed måned-cache fra server (første paint). */
export function seedMealPlanMonthCache(
  queryClient: ReturnType<typeof useQueryClient>,
  from: string,
  to: string,
  bundle: MealPlanBundle,
) {
  queryClient.setQueryData(mealPlanKeys.month(from, to), bundle);
}

export { mealPlanRangeKey };
