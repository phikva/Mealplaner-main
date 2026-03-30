"use client";

import Image from "next/image";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { getCategoryHref, getCategoryTagClassName } from "@/lib/category-tags";
import {
  RecipeFilterPanel,
  RecipeFilterTriggerButton,
  type RecipeSliderKey,
} from "@/components/recipes/recipe-filter-panel";
import { cn } from "@/lib/utils";
import {
  applyRecipeFilters,
  buildRecipeFilterOptionsFromSettingsAndRecipes,
  clampRecipeFilterState,
  computeRecipeFilterBounds,
  countActiveFilters,
  emptyRecipeFilterState,
  filtersToSearchParams,
  hasAnyActiveFilter,
  parseRecipeFilters,
  type RecipeCollectionItem,
  type RecipeFilterBounds,
  type RecipeFilterOptions,
  type RecipeFilterState,
} from "@/lib/recipes/recipe-filters";
import type { BrukerprofilSettings } from "@/types/page";

type Props = {
  recipes: RecipeCollectionItem[];
  brukerprofilSettings: BrukerprofilSettings | null;
};

const Q_DEBOUNCE_MS = 320;

type ActiveFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

function ActiveFilterChipsRow({ chips, className }: { chips: ActiveFilterChip[]; className?: string }) {
  if (chips.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.onRemove}
          className="inline-flex max-w-full items-center gap-1 rounded-full border border-border/60 bg-muted/35 py-1 pl-2.5 pr-1.5 text-left text-xs font-medium text-foreground transition hover:bg-muted/60"
          aria-label={`Fjern filter: ${c.label}`}
        >
          <span className="min-w-0 truncate">{c.label}</span>
          <X className="size-3.5 shrink-0 opacity-70" aria-hidden />
        </button>
      ))}
    </div>
  );
}

function applySlidingToFilters(
  base: RecipeFilterState,
  sliding: Partial<Record<RecipeSliderKey, number>>,
  b: RecipeFilterBounds,
): RecipeFilterState {
  const o = { ...base };
  if (sliding.maxKcal !== undefined) o.maxKcal = sliding.maxKcal >= b.kcal.max ? null : sliding.maxKcal;
  if (sliding.maxProtein !== undefined) {
    o.maxProtein = sliding.maxProtein >= b.protein.max ? null : sliding.maxProtein;
  }
  if (sliding.maxKarbs !== undefined) o.maxKarbs = sliding.maxKarbs >= b.karbs.max ? null : sliding.maxKarbs;
  if (sliding.maxFett !== undefined) o.maxFett = sliding.maxFett >= b.fett.max ? null : sliding.maxFett;
  return clampRecipeFilterState(o);
}

function commitSliderValue(key: RecipeSliderKey, raw: number, b: RecipeFilterBounds): number | null {
  switch (key) {
    case "maxKcal":
      return raw >= b.kcal.max ? null : raw;
    case "maxProtein":
      return raw >= b.protein.max ? null : raw;
    case "maxKarbs":
      return raw >= b.karbs.max ? null : raw;
    case "maxFett":
      return raw >= b.fett.max ? null : raw;
    default:
      return null;
  }
}

export function RecipeCollectionView({ recipes, brukerprofilSettings }: Props) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [sliding, setSliding] = useState<Partial<Record<RecipeSliderKey, number>>>({});
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const filterOptions: RecipeFilterOptions = useMemo(
    () => buildRecipeFilterOptionsFromSettingsAndRecipes(brukerprofilSettings, recipes),
    [brukerprofilSettings, recipes],
  );

  const bounds = useMemo(() => computeRecipeFilterBounds(recipes), [recipes]);

  const filters = useMemo(() => parseRecipeFilters(searchParams), [searchParams]);

  const [qDraft, setQDraft] = useState(filters.q);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    setQDraft(filters.q);
  }, [filters.q]);

  useEffect(() => {
    if (qDraft === filtersRef.current.q) return;
    const id = window.setTimeout(() => {
      const next = clampRecipeFilterState({ ...filtersRef.current, q: qDraft });
      const p = filtersToSearchParams(next);
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }, Q_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [qDraft, router, pathname]);

  const displayFilters = useMemo(
    () =>
      applySlidingToFilters(clampRecipeFilterState({ ...filters, q: qDraft }), sliding, bounds),
    [filters, qDraft, sliding, bounds],
  );

  const filteredRecipes = useMemo(
    () => applyRecipeFilters(recipes, displayFilters),
    [recipes, displayFilters],
  );

  const activeCount = useMemo(() => countActiveFilters(displayFilters), [displayFilters]);

  const replaceFilters = useCallback(
    (raw: RecipeFilterState) => {
      const next = clampRecipeFilterState(raw);
      const p = filtersToSearchParams(next);
      const q = p.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const patchFilters = useCallback(
    (patch: Partial<RecipeFilterState>) => {
      replaceFilters({ ...filtersRef.current, ...patch });
    },
    [replaceFilters],
  );

  const onSliderInput = useCallback((key: RecipeSliderKey, value: number) => {
    setSliding((s) => ({ ...s, [key]: value }));
  }, []);

  const onSliderCommit = useCallback(
    (key: RecipeSliderKey, raw: number) => {
      const v = commitSliderValue(key, raw, bounds);
      setSliding((s) => {
        const next = { ...s };
        delete next[key];
        return next;
      });
      replaceFilters(clampRecipeFilterState({ ...filtersRef.current, [key]: v }));
    },
    [bounds, replaceFilters],
  );

  const onClear = useCallback(() => {
    setQDraft("");
    setSliding({});
    replaceFilters(emptyRecipeFilterState());
  }, [replaceFilters]);

  const fromCategory = pathname?.startsWith("/kategori/") ? pathname.split("/")[2] : undefined;

  const getRecipeHref = (recipePath: string) => {
    if (!pathname) {
      return `/oppskrift/${recipePath}`;
    }
    const params = new URLSearchParams();
    const pFrom = filtersToSearchParams(displayFilters);
    const q = pFrom.toString();
    const fromValue = q ? `${pathname}?${q}` : pathname;
    params.set("from", fromValue);
    if (fromCategory) {
      params.set("fromCategory", fromCategory);
    }
    return `/oppskrift/${recipePath}?${params.toString()}`;
  };

  const panelBindings = {
    options: filterOptions,
    bounds,
    committedFilters: filters,
    displayFilters,
    qDraft,
    onQDraftChange: setQDraft,
    onDietToggle: (verdi: string) => {
      const f = filtersRef.current;
      const diets = f.diets.includes(verdi) ? f.diets.filter((d) => d !== verdi) : [...f.diets, verdi];
      patchFilters({ diets });
    },
    onAllergenToggle: (navn: string) => {
      const f = filtersRef.current;
      const excludeAllergens = f.excludeAllergens.includes(navn)
        ? f.excludeAllergens.filter((a) => a !== navn)
        : [...f.excludeAllergens, navn];
      patchFilters({ excludeAllergens });
    },
    onCategoryToggle: (categoryId: string) => {
      const f = filtersRef.current;
      const categoryIds = f.categoryIds.includes(categoryId)
        ? f.categoryIds.filter((id) => id !== categoryId)
        : [...f.categoryIds, categoryId];
      patchFilters({ categoryIds });
    },
    onSliderInput,
    onSliderCommit,
    onClear,
    activeFilterCount: activeCount,
  };

  const activeFilterChips = useMemo((): ActiveFilterChip[] => {
    const chips: ActiveFilterChip[] = [];
    const q = qDraft.trim();
    if (q) {
      const shown = q.length > 36 ? `${q.slice(0, 36)}…` : q;
      chips.push({
        key: "q",
        label: `Søk: «${shown}»`,
        onRemove: () => {
          setQDraft("");
          replaceFilters(clampRecipeFilterState({ ...filtersRef.current, q: "" }));
        },
      });
    }
    const f = displayFilters;
    for (const id of f.categoryIds) {
      const cat = filterOptions.categories.find((c) => c._id === id);
      if (!cat) continue;
      chips.push({
        key: `cat-${id}`,
        label: cat.name,
        onRemove: () => {
          const cur = filtersRef.current;
          patchFilters({ categoryIds: cur.categoryIds.filter((x) => x !== id) });
        },
      });
    }
    for (const verdi of f.diets) {
      const d = filterOptions.diets.find((o) => o.verdi === verdi);
      chips.push({
        key: `diet-${verdi}`,
        label: d?.navn ?? verdi,
        onRemove: () => {
          const cur = filtersRef.current;
          patchFilters({ diets: cur.diets.filter((x) => x !== verdi) });
        },
      });
    }
    for (const navn of f.excludeAllergens) {
      chips.push({
        key: `allergen-${navn}`,
        label: `Uten ${navn}`,
        onRemove: () => {
          const cur = filtersRef.current;
          patchFilters({ excludeAllergens: cur.excludeAllergens.filter((x) => x !== navn) });
        },
      });
    }
    if (f.maxKcal !== null) {
      chips.push({
        key: "maxKcal",
        label: `≤ ${Math.round(f.maxKcal)} kcal`,
        onRemove: () => patchFilters({ maxKcal: null }),
      });
    }
    if (f.maxProtein !== null) {
      chips.push({
        key: "maxProtein",
        label: `≤ ${Math.round(f.maxProtein * 10) / 10} g protein`,
        onRemove: () => patchFilters({ maxProtein: null }),
      });
    }
    if (f.maxKarbs !== null) {
      chips.push({
        key: "maxKarbs",
        label: `≤ ${Math.round(f.maxKarbs * 10) / 10} g karbohydrater`,
        onRemove: () => patchFilters({ maxKarbs: null }),
      });
    }
    if (f.maxFett !== null) {
      chips.push({
        key: "maxFett",
        label: `≤ ${Math.round(f.maxFett * 10) / 10} g fett`,
        onRemove: () => patchFilters({ maxFett: null }),
      });
    }
    return chips;
  }, [displayFilters, qDraft, filterOptions, patchFilters, replaceFilters]);

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="hidden flex-col gap-3 md:flex">
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="recipe-archive-search-desktop">
            Søk
          </label>
          <div className="relative min-w-0 max-w-xl flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="recipe-archive-search-desktop"
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              placeholder="Søk …"
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <RecipeFilterTriggerButton count={activeCount} onClick={() => setFilterPanelOpen(true)} />
          {hasAnyActiveFilter(displayFilters) ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-border/60 px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Nullstill
              <span className="ml-1 tabular-nums text-muted-foreground/90">({activeCount})</span>
            </button>
          ) : null}
        </div>
        <ActiveFilterChipsRow chips={activeFilterChips} />
      </div>

      <Dialog.Root open={filterPanelOpen} onOpenChange={setFilterPanelOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px]",
            )}
          />
          <Dialog.Content
            className={cn(
              "fixed z-50 flex min-h-0 flex-col overflow-hidden border border-border/80 bg-background shadow-2xl duration-200",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[min(92dvh,880px)] max-md:rounded-t-2xl",
              "max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:slide-out-to-bottom",
              "md:inset-y-4 md:right-4 md:left-auto md:top-4 md:bottom-4 md:max-h-[calc(100vh-2rem)] md:w-full md:max-w-md md:rounded-2xl",
              "md:data-[state=open]:slide-in-from-right md:data-[state=closed]:slide-out-to-right",
            )}
          >
            <div className="flex shrink-0 items-center justify-center pt-3 pb-2 md:hidden">
              <div className="h-1.5 w-10 rounded-full bg-muted" aria-hidden />
            </div>
            <Dialog.Title className="sr-only">Filter oppskrifter</Dialog.Title>
            <Dialog.Description className="sr-only">
              Søk og begrens listen etter kosthold, allergener og næring.
            </Dialog.Description>
            <RecipeFilterPanel
              {...panelBindings}
              layout="sheet"
              sheetFooter={
                <div
                  className={cn(
                    "z-[60] shrink-0 border-t border-border/70 bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md",
                    "max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setFilterPanelOpen(false)}
                    className="min-h-12 w-full rounded-xl bg-secondary py-3 text-sm font-semibold transition hover:bg-secondary/90"
                  >
                    Vis {filteredRecipes.length}{" "}
                    {filteredRecipes.length === 1 ? "oppskrift" : "oppskrifter"}
                  </button>
                </div>
              }
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <section className="min-w-0 space-y-4 md:space-y-5">
        <div className="flex flex-col gap-3 md:hidden">
          <div className="flex flex-wrap items-center gap-3">
            <RecipeFilterTriggerButton count={activeCount} onClick={() => setFilterPanelOpen(true)} />
            {hasAnyActiveFilter(displayFilters) ? (
              <button
                type="button"
                onClick={onClear}
                className="min-h-11 rounded-xl border border-border/60 px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Nullstill
              </button>
            ) : null}
          </div>

          <ActiveFilterChipsRow chips={activeFilterChips} />

          <div className="flex w-full justify-end">
            <div className="inline-flex shrink-0 rounded-lg border border-border/60 bg-background/85 p-1">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`rounded-md px-3 py-2 text-xs font-semibold ${
                  view === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground"
                }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`rounded-md px-3 py-2 text-xs font-semibold ${
                  view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground"
                }`}
              >
                Liste
              </button>
            </div>
          </div>
        </div>

        <div className="hidden flex-wrap items-center justify-between gap-2 md:flex">
          <p className="text-sm text-muted-foreground">
            {filteredRecipes.length}{" "}
            {filteredRecipes.length === 1 ? "oppskrift" : "oppskrifter"}
            {filteredRecipes.length !== recipes.length ? ` av ${recipes.length}` : null}
          </p>
          <div className="inline-flex rounded-lg border border-border/60 bg-background/85 p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold md:text-sm ${
                view === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground"
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold md:text-sm ${
                view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground"
              }`}
            >
              Liste
            </button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground md:hidden">
          {filteredRecipes.length}{" "}
          {filteredRecipes.length === 1 ? "oppskrift" : "oppskrifter"}
          {filteredRecipes.length !== recipes.length ? ` av ${recipes.length}` : null}
        </p>

        {filteredRecipes.length === 0 ? (
          <p className="rounded-xl border border-border/50 bg-card/40 p-6 text-sm text-muted-foreground">
            Ingen treff. Prøv å søke bredere eller nullstille filter.
          </p>
        ) : (
          <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-2"}>
            {filteredRecipes.map((recipe) => (
              <article
                key={recipe._id}
                className={`overflow-hidden rounded-xl bg-background/85 transition hover:-translate-y-0.5 ${
                  view === "list"
                    ? "grid grid-cols-[112px_1fr] gap-0 border-b border-border/60 pb-2 last:border-b-0 md:grid-cols-[180px_1fr]"
                    : "border border-border/40"
                }`}
              >
                <Link href={getRecipeHref(recipe.recipePath)} className="block">
                  <div
                    className={
                      view === "grid"
                        ? "relative aspect-video bg-muted/30"
                        : "relative h-full min-h-[100px] bg-muted/30 md:min-h-[120px]"
                    }
                  >
                    {recipe.imageUrl ? (
                      <Image
                        src={recipe.imageUrl}
                        alt={recipe.tittel}
                        width={900}
                        height={560}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground md:text-sm">
                        Ingen bilde
                      </div>
                    )}
                    {typeof recipe.totalKcal === "number" || typeof recipe.porsjoner === "number" ? (
                      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
                        {typeof recipe.totalKcal === "number" ? (
                          <span
                            className={`border border-border/70 bg-secondary font-sans font-semibold tracking-[0.02em] ${
                              view === "list"
                                ? "px-1.5 py-0 text-[9px] md:px-2 md:py-0.5 md:text-[10px]"
                                : "px-2 py-0.5 text-[10px]"
                            }`}
                          >
                            {Math.round(recipe.totalKcal)} kcal
                          </span>
                        ) : null}
                        {typeof recipe.porsjoner === "number" ? (
                          <span
                            className={`border border-border/70 bg-secondary font-sans font-semibold tracking-[0.02em] ${
                              view === "list"
                                ? "px-1.5 py-0 text-[9px] md:px-2 md:py-0.5 md:text-[10px]"
                                : "px-2 py-0.5 text-[10px]"
                            }`}
                          >
                            {recipe.porsjoner} porsjoner
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </Link>

                <div className={view === "grid" ? "space-y-3 p-4" : "space-y-2 p-3 md:p-4"}>
                  <Link href={getRecipeHref(recipe.recipePath)} className="block">
                    <h2
                      className={
                        view === "grid"
                          ? "line-clamp-2 text-xl font-bold leading-tight"
                          : "line-clamp-2 text-base font-bold leading-tight md:text-lg"
                      }
                    >
                      {recipe.tittel}
                    </h2>
                  </Link>
                  {recipe.categories && recipe.categories.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.categories.map((item) => (
                        <Link
                          key={`${recipe._id}-${item._id}`}
                          href={getCategoryHref(item)}
                          className={`rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold tracking-[0.02em] ${getCategoryTagClassName(item.name)}`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
