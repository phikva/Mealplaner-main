import { getTiers } from "@/lib/sanity/tiers";
import { getFavoriteRules, resolveTierForProfile } from "@/lib/tier-access";
import { createClient } from "@/lib/supabase/server";

export type ArchiveFavoritesContext = {
  isAuthenticated: boolean;
  canFavorite: boolean;
  favoritedIds: string[];
  maxFavorites: number | null;
  currentFavoriteCount: number;
};

export async function getArchiveFavoritesContext(recipeSanityIds: string[]): Promise<ArchiveFavoritesContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      isAuthenticated: false,
      canFavorite: false,
      favoritedIds: [],
      maxFavorites: null,
      currentFavoriteCount: 0,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier_sanity_id,tier_slug")
    .eq("id", user.id)
    .maybeSingle();

  const tiers = await getTiers();
  const tier = resolveTierForProfile(tiers, profile?.tier_sanity_id, profile?.tier_slug);
  const rules = getFavoriteRules(tier);

  const ids = [...new Set(recipeSanityIds.filter(Boolean))];
  let favoritedIds: string[] = [];
  if (ids.length > 0) {
    const { data: rows } = await supabase
      .from("recipe_favorites")
      .select("recipe_sanity_id")
      .eq("user_id", user.id)
      .in("recipe_sanity_id", ids);
    favoritedIds = rows?.map((r) => r.recipe_sanity_id) ?? [];
  }

  const { count } = await supabase
    .from("recipe_favorites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return {
    isAuthenticated: true,
    canFavorite: rules.canFavorite,
    favoritedIds,
    maxFavorites: rules.maxFavorites,
    currentFavoriteCount: count ?? 0,
  };
}
