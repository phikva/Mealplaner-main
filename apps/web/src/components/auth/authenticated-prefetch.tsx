"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/components/auth/session-provider";
import { FAVORITES_ROUTE, MEAL_PLANNER_ROUTE } from "@/lib/app-routes";
import { getFavoritesPageDataAction } from "@/app/actions/favorites-page";
import { monthRangeForAnchor } from "@/components/plan/meal-plan-cache";
import { favoritesKeys } from "@/lib/query/favorites";
import { fetchMealPlanBundle, mealPlanKeys } from "@/lib/query/meal-plan";

/** Prefetch ruter og TanStack Query-cache for innloggede brukere. */
export function AuthenticatedPrefetch() {
  const { status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status !== "signed_in") return;

    router.prefetch(MEAL_PLANNER_ROUTE.path);
    router.prefetch(FAVORITES_ROUTE.path);

    const month = monthRangeForAnchor(new Date());
    void queryClient.prefetchQuery({
      queryKey: mealPlanKeys.month(month.from, month.to),
      queryFn: () => fetchMealPlanBundle(month.from, month.to),
      staleTime: 5 * 60_000,
    });
    void queryClient.prefetchQuery({
      queryKey: favoritesKeys.page(),
      queryFn: async () => {
        const res = await getFavoritesPageDataAction();
        if ("ok" in res && res.ok === false) throw new Error(res.error);
        return res;
      },
      staleTime: 2 * 60_000,
    });
  }, [queryClient, router, status]);

  return null;
}
