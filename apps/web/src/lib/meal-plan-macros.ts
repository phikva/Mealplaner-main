import type { SanityRecipe } from "@/types/page";

export type MacroTotals = {
  kcal: number;
  protein: number;
  karbs: number;
  fett: number;
  count: number;
};

export const emptyMacroTotals = (): MacroTotals => ({
  kcal: 0,
  protein: 0,
  karbs: 0,
  fett: 0,
  count: 0,
});

/** Energi fra makroer (4–4–9) – brukes til fordelingsdiagram */
export function macroKcalFromGrams(totals: Pick<MacroTotals, "protein" | "karbs" | "fett">): {
  protein: number;
  karbs: number;
  fett: number;
  sum: number;
} {
  const protein = Math.max(0, totals.protein) * 4;
  const karbs = Math.max(0, totals.karbs) * 4;
  const fett = Math.max(0, totals.fett) * 9;
  const sum = protein + karbs + fett;
  return { protein, karbs, fett, sum };
}

type RecipeNutrition = Pick<SanityRecipe, "totalKcal" | "totalMakros" | "porsjoner">;

function scaleNutritionValue(value: number | undefined, divisor: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value / divisor;
}

/** Én planlagt porsjon – deler totaler på antall porsjoner i oppskriften. */
export function recipeNutritionPerPortion(recipe: RecipeNutrition): {
  totalKcal?: number;
  totalMakros?: SanityRecipe["totalMakros"];
} {
  const portions = recipe.porsjoner;
  const divisor =
    typeof portions === "number" && Number.isFinite(portions) && portions > 1 ? portions : 1;
  const m = recipe.totalMakros;
  return {
    totalKcal: scaleNutritionValue(recipe.totalKcal, divisor),
    totalMakros: m
      ? {
          protein: scaleNutritionValue(m.protein, divisor),
          karbs: scaleNutritionValue(m.karbs, divisor),
          fett: scaleNutritionValue(m.fett, divisor),
        }
      : undefined,
  };
}

export function sumMacrosFromRecipes(recipes: RecipeNutrition[]): MacroTotals {
  const t = emptyMacroTotals();
  for (const r of recipes) {
    t.count += 1;
    const scaled = recipeNutritionPerPortion(r);
    if (typeof scaled.totalKcal === "number" && Number.isFinite(scaled.totalKcal)) {
      t.kcal += scaled.totalKcal;
    }
    const m = scaled.totalMakros;
    if (typeof m?.protein === "number" && Number.isFinite(m.protein)) t.protein += m.protein;
    if (typeof m?.karbs === "number" && Number.isFinite(m.karbs)) t.karbs += m.karbs;
    if (typeof m?.fett === "number" && Number.isFinite(m.fett)) t.fett += m.fett;
  }
  return t;
}

export function formatMacroTotals(t: MacroTotals): string {
  const parts: string[] = [];
  if (t.kcal > 0) parts.push(`${Math.round(t.kcal)} kcal`);
  if (t.protein > 0) parts.push(`P ${Math.round(t.protein)} g`);
  if (t.karbs > 0) parts.push(`K ${Math.round(t.karbs)} g`);
  if (t.fett > 0) parts.push(`F ${Math.round(t.fett)} g`);
  return parts.length > 0 ? parts.join(" · ") : "Ingen næringsdata";
}

/** Kompakt P / K / F-linje for én oppskrifts totalMakros (måltidskort, modal). */
export function formatRecipeMacrosShort(m?: SanityRecipe["totalMakros"]): string {
  if (!m) return "";
  const parts: string[] = [];
  if (typeof m.protein === "number" && Number.isFinite(m.protein)) parts.push(`P ${Math.round(m.protein)} g`);
  if (typeof m.karbs === "number" && Number.isFinite(m.karbs)) parts.push(`K ${Math.round(m.karbs)} g`);
  if (typeof m.fett === "number" && Number.isFinite(m.fett)) parts.push(`F ${Math.round(m.fett)} g`);
  return parts.join(" · ");
}
