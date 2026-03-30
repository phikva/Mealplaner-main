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

const DEFAULT_BOUNDS: RecipeFilterBounds = {
  kcal: { min: 0, max: 4000 },
  protein: { min: 0, max: 250 },
  karbs: { min: 0, max: 400 },
  fett: { min: 0, max: 200 },
};

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

/** Kun maks-grenser (én slider per verdi): «inntil X» for enklere UX. */
export type RecipeFilterState = {
  q: string;
  categoryIds: string[];
  diets: string[];
  excludeAllergens: string[];
  maxKcal: number | null;
  maxProtein: number | null;
  maxKarbs: number | null;
  maxFett: number | null;
};

export const emptyRecipeFilterState = (): RecipeFilterState => ({
  q: "",
  categoryIds: [],
  diets: [],
  excludeAllergens: [],
  maxKcal: null,
  maxProtein: null,
  maxKarbs: null,
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
    maxKcal: parseOptNumber(sp, "maxKcal"),
    maxProtein: parseOptNumber(sp, "maxProtein"),
    maxKarbs: parseOptNumber(sp, "maxKarbs"),
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
  if (state.maxKcal !== null) p.set("maxKcal", String(state.maxKcal));
  if (state.maxProtein !== null) p.set("maxProtein", String(state.maxProtein));
  if (state.maxKarbs !== null) p.set("maxKarbs", String(state.maxKarbs));
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

    if (!atMost(r.totalKcal, state.maxKcal)) return false;

    const m = r.totalMakros;
    if (!atMost(m?.protein, state.maxProtein)) return false;
    if (!atMost(m?.karbs, state.maxKarbs)) return false;
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
  if (state.maxKcal !== null) n += 1;
  if (state.maxProtein !== null) n += 1;
  if (state.maxKarbs !== null) n += 1;
  if (state.maxFett !== null) n += 1;
  return n;
}

export function hasAnyActiveFilter(state: RecipeFilterState): boolean {
  return countActiveFilters(state) > 0;
}

export function clampRecipeFilterState(state: RecipeFilterState): RecipeFilterState {
  return { ...state };
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
