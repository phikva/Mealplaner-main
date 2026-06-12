"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFavoritesPageDataAction, type FavoritesPageData } from "@/app/actions/favorites-page";

export const favoritesKeys = {
  all: ["favorites"] as const,
  page: () => [...favoritesKeys.all, "page"] as const,
};

export function useFavoritesPage() {
  return useQuery({
    queryKey: favoritesKeys.page(),
    queryFn: async (): Promise<FavoritesPageData> => {
      const res = await getFavoritesPageDataAction();
      if ("ok" in res) {
        throw new Error(res.error);
      }
      return res;
    },
    staleTime: 2 * 60_000,
  });
}

export function useInvalidateFavorites() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: favoritesKeys.all });
}
