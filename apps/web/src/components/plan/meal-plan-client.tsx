"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { MealPlanView } from "@/components/plan/meal-plan-view";
import type { MealPlanBundle } from "@/components/plan/meal-plan-cache";
import type { MealPlanCategoryOption } from "@/components/plan/meal-plan-types";
import { seedMealPlanMonthCache } from "@/lib/query/meal-plan";

type Props = {
  categoryOptions: MealPlanCategoryOption[];
  mealStorageMaxDays: number | null;
  initialMonth: MealPlanBundle & { from: string; to: string };
  initialAnchorYmd: string;
};

export function MealPlanClient({
  categoryOptions,
  mealStorageMaxDays,
  initialMonth,
  initialAnchorYmd,
}: Props) {
  const queryClient = useQueryClient();

  useEffect(() => {
    seedMealPlanMonthCache(queryClient, initialMonth.from, initialMonth.to, {
      entries: initialMonth.entries,
      recipes: initialMonth.recipes,
    });
  }, [initialMonth, queryClient]);

  return (
    <MealPlanView
      initialAnchorYmd={initialAnchorYmd}
      initialMonth={initialMonth}
      categoryOptions={categoryOptions}
      mealStorageMaxDays={mealStorageMaxDays}
    />
  );
}
