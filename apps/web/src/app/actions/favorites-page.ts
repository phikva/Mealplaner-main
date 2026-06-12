"use server";

import { mapSanityRecipeToCollectionItem } from "@/lib/recipes/map-recipe-collection-item";
import type { ArchiveFavoritesContext } from "@/lib/recipes/archive-favorites-context";
import { getBrukerprofilSettings } from "@/lib/sanity/brukerprofil";
import { getRecipesByIds } from "@/lib/sanity/recipes";
import { getTiers } from "@/lib/sanity/tiers";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/session";
import { getFavoriteRules, resolveTierForProfile } from "@/lib/tier-access";
import type { RecipeCollectionItem } from "@/lib/recipes/recipe-filters";
import type { BrukerprofilSettings } from "@/types/page";
import type { SanityRecipe } from "@/types/page";

export type FavoritesPageData = {
  recipes: RecipeCollectionItem[];
  brukerprofilSettings: BrukerprofilSettings | null;
  favoritesContext: ArchiveFavoritesContext;
};

export async function getFavoritesPageDataAction():
  Promise<FavoritesPageData | { ok: false; error: "not_authenticated" }> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const supabase = await createClient();
  const [rowsRes, brukerprofilSettings, tiers, profileRes] = await Promise.all([
    supabase
      .from("recipe_favorites")
      .select("recipe_sanity_id,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getBrukerprofilSettings(),
    getTiers(),
    supabase.from("profiles").select("tier_sanity_id,tier_slug").eq("id", user.id).maybeSingle(),
  ]);

  const ids = (rowsRes.data ?? []).map((r) => r.recipe_sanity_id);
  const recipes = ids.length > 0 ? await getRecipesByIds(ids) : [];
  const byId = new Map(recipes.map((r) => [r._id, r]));
  const ordered: SanityRecipe[] = ids.map((id) => byId.get(id)).filter((r): r is SanityRecipe => Boolean(r));
  const items = ordered.map(mapSanityRecipeToCollectionItem);

  const tier = resolveTierForProfile(tiers, profileRes.data?.tier_sanity_id, profileRes.data?.tier_slug);
  const rules = getFavoriteRules(tier);

  return {
    recipes: items,
    brukerprofilSettings,
    favoritesContext: {
      isAuthenticated: true,
      canFavorite: rules.canFavorite,
      favoritedIds: ids,
      maxFavorites: rules.maxFavorites,
      currentFavoriteCount: ids.length,
    },
  };
}
