"use server";

import { revalidatePath } from "next/cache";
import { isPlanDateWithinStorageLimit } from "@/components/plan/meal-plan-dates";
import { MEAL_PLANNER_ROUTE } from "@/lib/app-routes";
import { getRecipesByIds } from "@/lib/sanity/recipes";
import { getTiers } from "@/lib/sanity/tiers";
import { createClient } from "@/lib/supabase/server";
import { getMealStorageRules, resolveTierForProfile } from "@/lib/tier-access";
import type { SanityRecipe } from "@/types/page";

export type MealPlanRow = {
  id: string;
  plan_date: string;
  sort_order: number;
  recipe_sanity_id: string;
};

export type MealPlanListError = "not_authenticated" | "query_failed";

export async function listMealPlanEntriesAction(
  fromIso: string,
  toIso: string,
): Promise<{ ok: true; entries: MealPlanRow[] } | { ok: false; error: MealPlanListError }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { data, error } = await supabase
    .from("meal_plan_entries")
    .select("id,plan_date,sort_order,recipe_sanity_id")
    .eq("user_id", user.id)
    .gte("plan_date", fromIso)
    .lte("plan_date", toIso)
    .order("plan_date", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) return { ok: false, error: "query_failed" };
  return { ok: true, entries: (data ?? []) as MealPlanRow[] };
}

export async function getMealPlanWithRecipesAction(
  fromIso: string,
  toIso: string,
): Promise<
  | { ok: true; entries: MealPlanRow[]; recipes: SanityRecipe[] }
  | { ok: false; error: MealPlanListError }
> {
  const bundle = await listMealPlanEntriesAction(fromIso, toIso);
  if (!bundle.ok) return bundle;
  const ids = [...new Set(bundle.entries.map((e) => e.recipe_sanity_id))];
  const recipes = await getRecipesByIds(ids);
  return { ok: true, entries: bundle.entries, recipes };
}

async function getMealStorageMaxDaysForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<number | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier_sanity_id,tier_slug")
    .eq("id", userId)
    .maybeSingle();

  const tiers = await getTiers();
  const tier = resolveTierForProfile(tiers, profile?.tier_sanity_id, profile?.tier_slug);
  return getMealStorageRules(tier).maxDays;
}

export async function addMealPlanEntryAction(input: {
  planDate: string;
  recipeSanityId: string;
}): Promise<{ ok: true } | { ok: false; error: "not_authenticated" | "date_out_of_range" | "unknown" }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const maxDays = await getMealStorageMaxDaysForUser(supabase, user.id);
  if (!isPlanDateWithinStorageLimit(input.planDate, maxDays)) {
    return { ok: false, error: "date_out_of_range" };
  }

  const { data: maxRow } = await supabase
    .from("meal_plan_entries")
    .select("sort_order")
    .eq("user_id", user.id)
    .eq("plan_date", input.planDate)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("meal_plan_entries").insert({
    user_id: user.id,
    plan_date: input.planDate,
    sort_order: nextOrder,
    recipe_sanity_id: input.recipeSanityId,
  });

  if (error) {
    return { ok: false, error: "unknown" };
  }
  revalidatePath(MEAL_PLANNER_ROUTE.path);
  return { ok: true };
}

export async function removeMealPlanEntryAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: "not_authenticated" | "unknown" }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { error } = await supabase.from("meal_plan_entries").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, error: "unknown" };
  revalidatePath(MEAL_PLANNER_ROUTE.path);
  return { ok: true };
}

const ymdRe = /^\d{4}-\d{2}-\d{2}$/;

export async function removeAllMealPlanEntriesForDateAction(
  planDate: string,
): Promise<{ ok: true } | { ok: false; error: "not_authenticated" | "invalid_date" | "unknown" }> {
  if (!ymdRe.test(planDate)) return { ok: false, error: "invalid_date" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { error } = await supabase
    .from("meal_plan_entries")
    .delete()
    .eq("user_id", user.id)
    .eq("plan_date", planDate);

  if (error) return { ok: false, error: "unknown" };
  revalidatePath(MEAL_PLANNER_ROUTE.path);
  return { ok: true };
}

function normalizeTargetDates(sourcePlanDate: string, targetDates: string[]): string[] {
  const out = new Set<string>();
  for (const s of targetDates) {
    if (!ymdRe.test(s)) continue;
    if (s === sourcePlanDate) continue;
    out.add(s);
  }
  return [...out].sort();
}

export async function copyMealPlanEntryToDatesAction(input: {
  sourceEntryId: string;
  targetDates: string[];
}): Promise<
  | { ok: true; added: number; skipped: number; skippedOutOfRange: number }
  | { ok: false; error: "not_authenticated" | "not_found" | "unknown" }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const { data: source, error: srcErr } = await supabase
    .from("meal_plan_entries")
    .select("id,plan_date,sort_order,recipe_sanity_id")
    .eq("id", input.sourceEntryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (srcErr || !source) return { ok: false, error: "not_found" };

  const sourceDate = source.plan_date as string;
  const sourceSort = source.sort_order as number;
  const targets = normalizeTargetDates(sourceDate, input.targetDates);
  if (targets.length === 0) {
    return { ok: true, added: 0, skipped: 0, skippedOutOfRange: 0 };
  }

  const maxDays = await getMealStorageMaxDaysForUser(supabase, user.id);
  const allowedTargets = targets.filter((d) => isPlanDateWithinStorageLimit(d, maxDays));
  const skippedOutOfRange = targets.length - allowedTargets.length;
  if (allowedTargets.length === 0) {
    return { ok: true, added: 0, skipped: 0, skippedOutOfRange };
  }

  const { data: existing, error: exErr } = await supabase
    .from("meal_plan_entries")
    .select("plan_date,sort_order,recipe_sanity_id")
    .eq("user_id", user.id)
    .in("plan_date", allowedTargets);

  if (exErr) return { ok: false, error: "unknown" };

  const occupied = new Map<string, { recipeId: string }>();
  for (const row of existing ?? []) {
    const pd = row.plan_date as string;
    const so = row.sort_order as number;
    const rid = row.recipe_sanity_id as string;
    occupied.set(`${pd}#${so}`, { recipeId: rid });
  }

  const recipeSanityId = source.recipe_sanity_id as string;
  const rows: { user_id: string; plan_date: string; sort_order: number; recipe_sanity_id: string }[] = [];
  let skipped = 0;
  for (const plan_date of allowedTargets) {
    const key = `${plan_date}#${sourceSort}`;
    const occ = occupied.get(key);
    if (occ) {
      // Ikke overskriv slot. Hvis det allerede er samme oppskrift i samme slot er dette en no-op.
      skipped += 1;
      continue;
    }
    rows.push({
      user_id: user.id,
      plan_date,
      sort_order: sourceSort,
      recipe_sanity_id: recipeSanityId,
    });
  }

  if (rows.length === 0) {
    return { ok: true, added: 0, skipped, skippedOutOfRange };
  }

  const { error } = await supabase.from("meal_plan_entries").insert(rows);
  if (error) return { ok: false, error: "unknown" };

  revalidatePath(MEAL_PLANNER_ROUTE.path);
  return { ok: true, added: rows.length, skipped, skippedOutOfRange };
}

export async function copyMealPlanDayToDatesAction(input: {
  sourcePlanDate: string;
  targetDates: string[];
}): Promise<
  | { ok: true; added: number; skipped: number; skippedOutOfRange: number }
  | { ok: false; error: "not_authenticated" | "unknown" }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  const sourceDate = input.sourcePlanDate;
  if (!ymdRe.test(sourceDate)) return { ok: true, added: 0, skipped: 0, skippedOutOfRange: 0 };

  const targets = normalizeTargetDates(sourceDate, input.targetDates);
  if (targets.length === 0) return { ok: true, added: 0, skipped: 0, skippedOutOfRange: 0 };

  const maxDays = await getMealStorageMaxDaysForUser(supabase, user.id);
  const allowedTargets = targets.filter((d) => isPlanDateWithinStorageLimit(d, maxDays));
  const skippedOutOfRange = targets.length - allowedTargets.length;
  if (allowedTargets.length === 0) {
    return { ok: true, added: 0, skipped: 0, skippedOutOfRange };
  }

  const { data: sourceRows, error: srcErr } = await supabase
    .from("meal_plan_entries")
    .select("sort_order,recipe_sanity_id")
    .eq("user_id", user.id)
    .eq("plan_date", sourceDate)
    .order("sort_order", { ascending: true });

  if (srcErr) return { ok: false, error: "unknown" };
  if (!sourceRows || sourceRows.length === 0) {
    return { ok: true, added: 0, skipped: 0, skippedOutOfRange };
  }

  const { data: existing, error: exErr } = await supabase
    .from("meal_plan_entries")
    .select("plan_date,sort_order")
    .eq("user_id", user.id)
    .in("plan_date", allowedTargets);

  if (exErr) return { ok: false, error: "unknown" };

  const occupied = new Set<string>();
  for (const row of existing ?? []) {
    occupied.add(`${row.plan_date as string}#${row.sort_order as number}`);
  }

  const rows: { user_id: string; plan_date: string; sort_order: number; recipe_sanity_id: string }[] = [];
  let skipped = 0;
  for (const plan_date of allowedTargets) {
    for (const s of sourceRows) {
      const so = s.sort_order as number;
      const key = `${plan_date}#${so}`;
      if (occupied.has(key)) {
        skipped += 1;
        continue;
      }
      rows.push({
        user_id: user.id,
        plan_date,
        sort_order: so,
        recipe_sanity_id: s.recipe_sanity_id as string,
      });
      occupied.add(key);
    }
  }

  if (rows.length === 0) return { ok: true, added: 0, skipped, skippedOutOfRange };

  const { error } = await supabase.from("meal_plan_entries").insert(rows);
  if (error) return { ok: false, error: "unknown" };

  revalidatePath(MEAL_PLANNER_ROUTE.path);
  return { ok: true, added: rows.length, skipped, skippedOutOfRange };
}
