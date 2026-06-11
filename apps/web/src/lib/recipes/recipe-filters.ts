import type { SanityRecipe } from "@/types/page";

export type RecipeCollectionItem = {
  _id: string;
  tittel: string;
  recipePath: string;
  imageUrl: string | null;
  totalKcal?: number;
  porsjoner?: number;
  categories?: SanityRecipe["categories"];
  categoryIds?: string[];
  dietTags?: string[];
  allergens?: string[];
  totalMakros?: SanityRecipe["totalMakros"];
};

export type RecipeCategoryOption = {
  _id: string;
  name: string;
  path: string;
};

export type RecipeFilterOptions = {
  diets: { verdi: string; navn: string }[];
  allergens: { navn: string }[];
  categories: RecipeCategoryOption[];
};

export type RecipeFilterBounds = {
  kcal: { min: number; max: number };
  protein: { min: number; max: number };
  karbs: { min: number; max: number };
  fett: { min: number; max: number };
};

/** Standard glidebryter-intervaller når vi ikke har en dynamisk liste (f.eks. måltidsvelger). */
export const DEFAULT_RECIPE_FILTER_BOUNDS: RecipeFilterBounds = {
  kcal: { min: 0, max: 4000 },
  protein: { min: 0, max: 250 },
  karbs: { min: 0, max: 400 },
  fett: { min: 0, max: 200 },
};

const DEFAULT_BOUNDS = DEFAULT_RECIPE_FILTER_BOUNDS;

function widenRange(min: number, max: number, padRatio = 0.05): { min: number; max: number } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 };
  if (min === max) {
    const pad = Math.max(1, Math.abs(min) * padRatio);
    return { min: Math.max(0, min - pad), max: max + pad };
  }
  const span = max - min;
  const pad = span * padRatio;
  return { min: Math.max(0, min - pad), max: max + pad };
}

export function computeRecipeFilterBounds(
  recipes: Pick<RecipeCollectionItem, "totalKcal" | "totalMakros">[],
): RecipeFilterBounds {
  const kcals = recipes
    .map((r) => r.totalKcal)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  const proteins = recipes
    .map((r) => r.totalMakros?.protein)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  const karbs = recipes
    .map((r) => r.totalMakros?.karbs)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  const fetts = recipes
    .map((r) => r.totalMakros?.fett)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));

  const pick = (vals: number[], def: { min: number; max: number }) => {
    if (vals.length === 0) return def;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return widenRange(min, max);
  };

  return {
    kcal: pick(kcals, DEFAULT_BOUNDS.kcal),
    protein: pick(proteins, DEFAULT_BOUNDS.protein),
    karbs: pick(karbs, DEFAULT_BOUNDS.karbs),
    fett: pick(fetts, DEFAULT_BOUNDS.fett),
  };
}

export type RecipeNutritionFilterKey =
  | "minKcal"
  | "maxKcal"
  | "minProtein"
  | "maxProtein"
  | "minKarbs"
  | "maxKarbs"
  | "minFett"
  | "maxFett";

/** Min/maks-grenser (én slider per verdi). */
export type RecipeFilterState = {
  q: string;
  categoryIds: string[];
  diets: string[];
  excludeAllergens: string[];
  minKcal: number | null;
  maxKcal: number | null;
  minProtein: number | null;
  maxProtein: number | null;
  minKarbs: number | null;
  maxKarbs: number | null;
  minFett: number | null;
  maxFett: number | null;
};

export const emptyRecipeFilterState = (): RecipeFilterState => ({
  q: "",
  categoryIds: [],
  diets: [],
  excludeAllergens: [],
  minKcal: null,
  maxKcal: null,
  minProtein: null,
  maxProtein: null,
  minKarbs: null,
  maxKarbs: null,
  minFett: null,
  maxFett: null,
});

function parseOptNumber(sp: Pick<URLSearchParams, "get">, key: string): number | null {
  const raw = sp.get(key);
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function parseRecipeFilters(
  sp: Pick<URLSearchParams, "getAll" | "get">,
): RecipeFilterState {
  const diets = sp.getAll("diet").filter(Boolean);
  const excludeAllergens = sp.getAll("excludeAllergen").filter(Boolean);
  const categoryIds = sp.getAll("category").filter(Boolean);
  const q = sp.get("q")?.trim() ?? "";

  return {
    q,
    categoryIds,
    diets,
    excludeAllergens,
    minKcal: parseOptNumber(sp, "minKcal"),
    maxKcal: parseOptNumber(sp, "maxKcal"),
    minProtein: parseOptNumber(sp, "minProtein"),
    maxProtein: parseOptNumber(sp, "maxProtein"),
    minKarbs: parseOptNumber(sp, "minKarbs"),
    maxKarbs: parseOptNumber(sp, "maxKarbs"),
    minFett: parseOptNumber(sp, "minFett"),
    maxFett: parseOptNumber(sp, "maxFett"),
  };
}

export function filtersToSearchParams(state: RecipeFilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (state.q.trim()) p.set("q", state.q.trim());
  for (const c of state.categoryIds) {
    if (c) p.append("category", c);
  }
  for (const d of state.diets) {
    if (d) p.append("diet", d);
  }
  for (const a of state.excludeAllergens) {
    if (a) p.append("excludeAllergen", a);
  }
  if (state.minKcal !== null) p.set("minKcal", String(state.minKcal));
  if (state.maxKcal !== null) p.set("maxKcal", String(state.maxKcal));
  if (state.minProtein !== null) p.set("minProtein", String(state.minProtein));
  if (state.maxProtein !== null) p.set("maxProtein", String(state.maxProtein));
  if (state.minKarbs !== null) p.set("minKarbs", String(state.minKarbs));
  if (state.maxKarbs !== null) p.set("maxKarbs", String(state.maxKarbs));
  if (state.minFett !== null) p.set("minFett", String(state.minFett));
  if (state.maxFett !== null) p.set("maxFett", String(state.maxFett));
  return p;
}

export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function matchesSearch(recipe: Pick<RecipeCollectionItem, "tittel" | "categories">, q: string) {
  const trimmed = q.trim();
  if (!trimmed) return true;
  const needle = normalizeForSearch(trimmed);
  if (normalizeForSearch(recipe.tittel).includes(needle)) return true;
  return (recipe.categories ?? []).some((c) => normalizeForSearch(c.name).includes(needle));
}

/** Verdi må være definert og ≤ maks når maks er satt. */
function atMost(value: number | undefined, max: number | null): boolean {
  if (max === null) return true;
  if (value == null || !Number.isFinite(value)) return false;
  return value <= max;
}

/** Verdi må være definert og ≥ min når min er satt. */
function atLeast(value: number | undefined, min: number | null): boolean {
  if (min === null) return true;
  if (value == null || !Number.isFinite(value)) return false;
  return value >= min;
}

export function applyRecipeFilters(recipes: RecipeCollectionItem[], state: RecipeFilterState): RecipeCollectionItem[] {
  const excluded = new Set(state.excludeAllergens.map((a) => a.toLowerCase()));
  return recipes.filter((r) => {
    if (!matchesSearch(r, state.q)) return false;

    const allergens = (r.allergens ?? []).map((a) => a.toLowerCase());
    if (!allergens.every((a) => !excluded.has(a))) return false;

    if (state.categoryIds.length > 0) {
      const wanted = new Set(state.categoryIds);
      const recipeCatIds =
        r.categoryIds ??
        (r.categories ?? []).map((c) => c._id).filter(Boolean);
      if (!recipeCatIds.some((id) => wanted.has(id))) return false;
    }

    if (state.diets.length > 0) {
      const tags = r.dietTags ?? [];
      if (!state.diets.some((d) => tags.includes(d))) return false;
    }

    if (!atLeast(r.totalKcal, state.minKcal)) return false;
    if (!atMost(r.totalKcal, state.maxKcal)) return false;

    const m = r.totalMakros;
    if (!atLeast(m?.protein, state.minProtein)) return false;
    if (!atMost(m?.protein, state.maxProtein)) return false;
    if (!atLeast(m?.karbs, state.minKarbs)) return false;
    if (!atMost(m?.karbs, state.maxKarbs)) return false;
    if (!atLeast(m?.fett, state.minFett)) return false;
    if (!atMost(m?.fett, state.maxFett)) return false;

    return true;
  });
}

export function countActiveFilters(state: RecipeFilterState): number {
  let n = 0;
  if (state.q.trim()) n += 1;
  n += state.categoryIds.length;
  n += state.diets.length;
  n += state.excludeAllergens.length;
  if (state.minKcal !== null) n += 1;
  if (state.maxKcal !== null) n += 1;
  if (state.minProtein !== null) n += 1;
  if (state.maxProtein !== null) n += 1;
  if (state.minKarbs !== null) n += 1;
  if (state.maxKarbs !== null) n += 1;
  if (state.minFett !== null) n += 1;
  if (state.maxFett !== null) n += 1;
  return n;
}

export function hasAnyActiveFilter(state: RecipeFilterState): boolean {
  return countActiveFilters(state) > 0;
}

export function clampRecipeFilterState(state: RecipeFilterState): RecipeFilterState {
  return { ...state };
}

/** Glidebryter: maks helt til høyre = null; min helt til venstre = null. */
export function commitSliderValue(
  key: RecipeNutritionFilterKey,
  raw: number,
  b: RecipeFilterBounds,
): number | null {
  switch (key) {
    case "minKcal":
      return raw <= b.kcal.min ? null : raw;
    case "maxKcal":
      return raw >= b.kcal.max ? null : raw;
    case "minProtein":
      return raw <= b.protein.min ? null : raw;
    case "maxProtein":
      return raw >= b.protein.max ? null : raw;
    case "minKarbs":
      return raw <= b.karbs.min ? null : raw;
    case "maxKarbs":
      return raw >= b.karbs.max ? null : raw;
    case "minFett":
      return raw <= b.fett.min ? null : raw;
    case "maxFett":
      return raw >= b.fett.max ? null : raw;
    default:
      return null;
  }
}

export function applySlidingToRecipeFilters(
  base: RecipeFilterState,
  sliding: Partial<Record<RecipeNutritionFilterKey, number>>,
  b: RecipeFilterBounds,
): RecipeFilterState {
  const o = { ...base };
  for (const key of Object.keys(sliding) as RecipeNutritionFilterKey[]) {
    const raw = sliding[key];
    if (raw === undefined) continue;
    o[key] = commitSliderValue(key, raw, b);
  }
  return clampRecipeFilterState(o);
}

export function buildCategoryOptionsFromRecipes(
  recipes: Pick<RecipeCollectionItem, "categories">[],
): RecipeCategoryOption[] {
  const map = new Map<string, RecipeCategoryOption>();
  for (const r of recipes) {
    for (const c of r.categories ?? []) {
      if (!c._id) continue;
      if (map.has(c._id)) continue;
      const path = c.path || c.slug?.current || c._id;
      map.set(c._id, { _id: c._id, name: c.name, path });
    }
  }
  return [...map.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "nb", { sensitivity: "base" }),
  );
}

export function buildRecipeFilterOptionsFromSettingsAndRecipes(
  settings: {
    kostholdsbehov?: { verdi: string; navn: string }[];
    vanligeAllergier?: { navn: string }[];
  } | null,
  recipes: Pick<RecipeCollectionItem, "dietTags" | "allergens" | "categories">[],
): RecipeFilterOptions {
  const dietsFromCms = settings?.kostholdsbehov ?? [];
  let diets: { verdi: string; navn: string }[];
  if (dietsFromCms.length > 0) {
    diets = [...dietsFromCms].sort((a, b) =>
      a.navn.localeCompare(b.navn, "nb", { sensitivity: "base" }),
    );
  } else {
    const map = new Map<string, string>();
    for (const r of recipes) {
      for (const t of r.dietTags ?? []) {
        if (!map.has(t)) map.set(t, t);
      }
    }
    diets = [...map.entries()]
      .map(([verdi, navn]) => ({ verdi, navn }))
      .sort((a, b) => a.navn.localeCompare(b.navn, "nb", { sensitivity: "base" }));
  }

  const allergensFromCms = settings?.vanligeAllergier ?? [];
  let allergens: { navn: string }[];
  if (allergensFromCms.length > 0) {
    allergens = [...allergensFromCms].map((o) => ({ navn: o.navn }));
  } else {
    const seen = new Set<string>();
    allergens = [];
    for (const r of recipes) {
      for (const a of r.allergens ?? []) {
        if (!seen.has(a)) {
          seen.add(a);
          allergens.push({ navn: a });
        }
      }
    }
    allergens.sort((a, b) =>
      a.navn.localeCompare(b.navn, "nb", { sensitivity: "base" }),
    );
  }

  const categories = buildCategoryOptionsFromRecipes(recipes);

  return { diets, allergens, categories };
}
