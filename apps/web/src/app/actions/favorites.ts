"use server";

import { revalidatePath } from "next/cache";
import { FAVORITES_ROUTE } from "@/lib/app-routes";
import { createClient } from "@/lib/supabase/server";
import { getTiers } from "@/lib/sanity/tiers";
import { getFavoriteRules, resolveTierForProfile } from "@/lib/tier-access";

export type ToggleFavoriteResult =
  | { ok: true; favorited: boolean }
  | { ok: false; error: "not_authenticated" | "tier_denied" | "at_limit" | "unknown" };

export async function toggleFavoriteAction(recipeSanityId: string): Promise<ToggleFavoriteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier_sanity_id,tier_slug")
    .eq("id", user.id)
    .maybeSingle();

  const tiers = await getTiers();
  const tier = resolveTierForProfile(tiers, profile?.tier_sanity_id, profile?.tier_slug);
  const rules = getFavoriteRules(tier);
  if (!rules.canFavorite) return { ok: false, error: "tier_denied" };

  const { data: existing } = await supabase
    .from("recipe_favorites")
    .select("recipe_sanity_id")
    .eq("user_id", user.id)
    .eq("recipe_sanity_id", recipeSanityId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("recipe_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("recipe_sanity_id", recipeSanityId);
    if (error) return { ok: false, error: "unknown" };
    revalidatePath(FAVORITES_ROUTE.path);
    revalidatePath("/oppskrifter");
    revalidatePath("/kategori", "layout");
    return { ok: true, favorited: false };
  }

  if (rules.maxFavorites != null) {
    const { count, error: cErr } = await supabase
      .from("recipe_favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (cErr) return { ok: false, error: "unknown" };
    if ((count ?? 0) >= rules.maxFavorites) return { ok: false, error: "at_limit" };
  }

  const { error } = await supabase.from("recipe_favorites").insert({
    user_id: user.id,
    recipe_sanity_id: recipeSanityId,
  });
  if (error) return { ok: false, error: "unknown" };
  revalidatePath(FAVORITES_ROUTE.path);
  revalidatePath("/oppskrifter");
  revalidatePath("/kategori", "layout");
  return { ok: true, favorited: true };
}

export async function isRecipeFavoritedAction(recipeSanityId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("recipe_favorites")
    .select("recipe_sanity_id")
    .eq("user_id", user.id)
    .eq("recipe_sanity_id", recipeSanityId)
    .maybeSingle();
  return Boolean(data);
}
