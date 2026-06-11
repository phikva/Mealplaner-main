import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { recipeThumbUrl } from "@/lib/sanity/recipe-thumb";
import { getRecipesByIds, searchOrBrowseRecipesForPicker } from "@/lib/sanity/recipes";
import type { SanityRecipe } from "@/types/page";

function toPickerRows(recipes: SanityRecipe[]) {
  return recipes.map((r) => ({
    _id: r._id,
    tittel: r.tittel,
    path: r.path,
    totalKcal: r.totalKcal,
    totalMakros: r.totalMakros,
    porsjoner: r.porsjoner,
    imageUrl: recipeThumbUrl(r.image),
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const favoritesOnly = searchParams.get("favorites") === "1";

  if (favoritesOnly) {
    const pendingCookies: Array<{
      name: string;
      value: string;
      options: Parameters<NextResponse["cookies"]["set"]>[2];
    }> = [];

    const supabase = createServerClient(
      env.nextPublicSupabaseUrl,
      env.nextPublicSupabaseAnonKey,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              pendingCookies.push({ name, value, options });
            });
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const response = NextResponse.json({ recipes: [] });
      pendingCookies.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    }

    const { data: favRows } = await supabase
      .from("recipe_favorites")
      .select("recipe_sanity_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const ids = (favRows ?? []).map((row) => row.recipe_sanity_id).filter(Boolean);
    if (ids.length === 0) {
      const empty = NextResponse.json({ recipes: [] });
      pendingCookies.forEach(({ name, value, options }) => {
        empty.cookies.set(name, value, options);
      });
      return empty;
    }

    let recipes = await getRecipesByIds(ids);
    const order = new Map(ids.map((id, i) => [id, i]));
    recipes.sort((a, b) => (order.get(a._id) ?? 0) - (order.get(b._id) ?? 0));

    const t = q.trim();
    if (t.length >= 2) {
      const lower = t.toLowerCase();
      recipes = recipes.filter((r) => (r.tittel ?? "").toLowerCase().includes(lower));
    }

    const response = NextResponse.json({ recipes: toPickerRows(recipes) });
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  }

  const recipes = await searchOrBrowseRecipesForPicker(q, category || null);
  return NextResponse.json({ recipes: toPickerRows(recipes) });
}
