import { NextResponse } from "next/server";
import { recipeThumbUrl } from "@/lib/sanity/recipe-thumb";
import { searchOrBrowseRecipesForPicker } from "@/lib/sanity/recipes";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";

  const recipes = await searchOrBrowseRecipesForPicker(q, category || null);

  return NextResponse.json({
    recipes: recipes.map((r) => ({
      _id: r._id,
      tittel: r.tittel,
      path: r.path,
      totalKcal: r.totalKcal,
      totalMakros: r.totalMakros,
      imageUrl: recipeThumbUrl(r.image),
    })),
  });
}
