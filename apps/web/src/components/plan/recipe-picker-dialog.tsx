"use client";

import Image from "next/image";
import { Dialog, VisuallyHidden } from "radix-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { addMealPlanEntryAction } from "@/app/actions/meal-plan";
import { isPlanDateWithinStorageLimit } from "@/components/plan/meal-plan-dates";
import { MaxSliderRow, MinSliderRow, type RecipeSliderKey } from "@/components/recipes/recipe-filter-panel";
import { RecipeNutritionLine } from "@/components/plan/plan-nutrition";
import {
  MEAL_PLAN_PICKER_FAVORITES_VALUE,
  type MealPlanCategoryOption,
  type RecipeSearchHit,
} from "@/components/plan/meal-plan-types";
import {
  applyRecipeFilters,
  applySlidingToRecipeFilters,
  commitSliderValue,
  DEFAULT_RECIPE_FILTER_BOUNDS,
  emptyRecipeFilterState,
  type RecipeCollectionItem,
  type RecipeFilterState,
} from "@/lib/recipes/recipe-filters";
import { recipeNutritionPerPortion } from "@/lib/meal-plan-macros";
import { cn } from "@/lib/utils";

type Props = {
  planDate: string;
  categoryOptions: MealPlanCategoryOption[];
  mealStorageMaxDays: number | null;
  onAdded: () => void;
  compact?: boolean;
  /** I kolonne-header (tom dag) – ikke skyv til bunnen av flex-kolonnen. */
  inline?: boolean;
};

type NutritionBounds = Pick<
  RecipeFilterState,
  | "minKcal"
  | "maxKcal"
  | "minProtein"
  | "maxProtein"
  | "minKarbs"
  | "maxKarbs"
  | "minFett"
  | "maxFett"
>;

const emptyNutrition = (): NutritionBounds => ({
  minKcal: null,
  maxKcal: null,
  minProtein: null,
  maxProtein: null,
  minKarbs: null,
  maxKarbs: null,
  minFett: null,
  maxFett: null,
});

function nutritionActive(n: NutritionBounds): boolean {
  return (
    n.minKcal !== null ||
    n.maxKcal !== null ||
    n.minProtein !== null ||
    n.maxProtein !== null ||
    n.minKarbs !== null ||
    n.maxKarbs !== null ||
    n.minFett !== null ||
    n.maxFett !== null
  );
}

export function AddMealPlanButton({
  planDate,
  categoryOptions,
  mealStorageMaxDays,
  onAdded,
  compact,
  inline,
}: Props) {
  const dateAllowed = isPlanDateWithinStorageLimit(planDate, mealStorageMaxDays);
  const [open, setOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<RecipeSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [nutrition, setNutrition] = useState<NutritionBounds>(emptyNutrition);
  const [sliding, setSliding] = useState<Partial<Record<RecipeSliderKey, number>>>({});
  /** Ernæring er sekundært – lukket som standard så oppskriftslisten får plass. */
  const [nutritionExpanded, setNutritionExpanded] = useState(false);

  const bounds = DEFAULT_RECIPE_FILTER_BOUNDS;

  const fetchList = useCallback(async (search: string, category: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (category === MEAL_PLAN_PICKER_FAVORITES_VALUE) {
        params.set("favorites", "1");
      } else if (category) {
        params.set("category", category);
      }
      const res = await fetch(`/api/recipes/search?${params.toString()}`);
      const data = (await res.json()) as { recipes: RecipeSearchHit[] };
      setHits(data.recipes ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = q.trim();
    if (t.length === 1) {
      setHits([]);
      return;
    }
    if (t.length >= 2) {
      const id = window.setTimeout(() => {
        void fetchList(q, categoryFilter);
      }, 280);
      return () => window.clearTimeout(id);
    }
    void fetchList("", categoryFilter);
  }, [open, q, categoryFilter, fetchList]);

  const effectiveNutrition = useMemo(
    () =>
      applySlidingToRecipeFilters(
        { ...emptyRecipeFilterState(), ...nutrition },
        sliding,
        bounds,
      ),
    [nutrition, sliding, bounds],
  );

  const filteredHits = useMemo(
    () => applyRecipeFilters(hits as RecipeCollectionItem[], effectiveNutrition),
    [hits, effectiveNutrition],
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
      setNutrition((n) => ({ ...n, [key]: v }));
    },
    [bounds],
  );

  const kcalSpan = bounds.kcal.max - bounds.kcal.min;
  const kcalStep = kcalSpan > 800 ? 25 : kcalSpan > 200 ? 10 : 1;
  const macroStep = 1;

  const pick = async (r: RecipeSearchHit) => {
    const res = await addMealPlanEntryAction({
      planDate,
      recipeSanityId: r._id,
    });
    if (res.ok) {
      setOpen(false);
      setQ("");
      onAdded();
      return;
    }
    if (res.error === "date_out_of_range") {
      toast.info("Denne datoen er utenfor det abonnementet ditt tillater.");
      return;
    }
    if (res.error === "not_authenticated") {
      toast.error("Logg inn på nytt for å legge til måltider.");
      return;
    }
    toast.error("Kunne ikke legge til måltid. Prøv igjen.");
  };

  const listTitle =
    categoryFilter === MEAL_PLAN_PICKER_FAVORITES_VALUE
      ? q.trim().length >= 2
        ? "Søk i favoritter"
        : "Favoritter"
      : q.trim().length >= 2
        ? "Søketreff"
        : "Oppskrifter";

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQ("");
      setCategoryFilter("");
      setHits([]);
      setNutrition(emptyNutrition());
      setSliding({});
      setNutritionExpanded(false);
    }
  };

  const wrapperClass = compact ? "mt-1" : inline ? "mt-2" : "mt-auto pt-2";

  if (!dateAllowed) {
    return (
      <div className={wrapperClass} aria-disabled="true">
        <p
          className={cn(
            "pointer-events-none select-none text-center text-[10px] leading-snug text-muted-foreground",
            compact ? "px-0.5 py-1" : "rounded-xl border border-dashed border-border/40 px-2 py-2.5 text-xs",
          )}
          title="Denne datoen er utenfor abonnementet ditt"
        >
          {compact ? "—" : "Utenfor abonnement"}
        </p>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {!compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl border border-dashed border-border/60 font-semibold text-muted-foreground hover:bg-muted/60",
            inline ? "min-h-9 py-2 text-[10px] leading-tight" : "min-h-11 py-2.5 text-xs",
          )}
        >
          <Plus className="size-3.5" />
          Legg til måltid
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "min-h-11 w-full cursor-pointer rounded-xl border border-dashed border-border/55 py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/10",
            "touch-manipulation",
          )}
        >
          +
        </button>
      )}

      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]",
            )}
          />
          <Dialog.Content
            className={cn(
              "fixed z-50 flex max-h-[min(90dvh,900px)] w-full max-w-lg flex-col border border-border/50 bg-background shadow-2xl duration-200 outline-none",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "max-md:inset-x-0 max-md:bottom-0 max-md:rounded-t-3xl max-md:border-b-0 max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:slide-out-to-bottom",
              "max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))]",
              "md:left-1/2 md:top-1/2 md:max-h-[min(85vh,720px)] md:w-[calc(100%-2rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] md:data-[state=open]:zoom-in-95 md:data-[state=closed]:zoom-out-95",
            )}
          >
            <VisuallyHidden.Root>
              <Dialog.Title id="add-meal-title">Legg til måltid</Dialog.Title>
              <Dialog.Description>
                Velg kategori, søk eventuelt, filtrer på næring, og trykk på en oppskrift for å legge den til{" "}
                {planDate}.
              </Dialog.Description>
            </VisuallyHidden.Root>
            <div className="flex max-h-[min(90dvh,900px)] min-h-0 flex-col md:max-h-[min(85vh,720px)]">
              <div className="flex shrink-0 justify-center bg-gradient-to-b from-muted/35 to-background pt-1 md:rounded-t-2xl md:pt-0.5">
                <div className="h-1 w-9 shrink-0 rounded-full bg-muted-foreground/25 md:hidden" aria-hidden />
              </div>
              <div className="shrink-0 space-y-1.5 border-b border-border/40 bg-muted/15 px-3 pb-1.5 pt-0.5 md:px-4 md:pb-2 md:pt-2">
                <div
                  className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0"
                  aria-hidden
                >
                  <span className="text-sm font-semibold tracking-tight text-foreground md:text-base">
                    Legg til måltid
                  </span>
                  <span className="text-[10px] font-medium tabular-nums text-muted-foreground">{planDate}</span>
                </div>
                <div className="space-y-1">
                  <label
                    className="text-[11px] font-semibold leading-none text-foreground"
                    htmlFor="meal-picker-category"
                  >
                    Kategori
                  </label>
                  <select
                    id="meal-picker-category"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-10 min-h-10 w-full rounded-xl border border-border/60 bg-background px-2 py-1 text-sm shadow-sm md:h-8 md:min-h-0 md:text-sm"
                  >
                    <option value="">Alle kategorier</option>
                    <option value={MEAL_PLAN_PICKER_FAVORITES_VALUE}>Favoritter</option>
                    {categoryOptions.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label
                    className="text-[11px] font-semibold leading-none text-foreground"
                    htmlFor="meal-picker-search"
                  >
                    Søk (valgfritt)
                  </label>
                  <input
                    id="meal-picker-search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Søk etter tittel …"
                    className="h-10 min-h-10 w-full rounded-xl border border-border/60 bg-background px-2 py-1 text-sm shadow-sm placeholder:text-muted-foreground md:h-8 md:min-h-0"
                    autoComplete="off"
                  />
                </div>

                <div className="border-t border-border/35 pt-1.5">
                  <div className="flex items-stretch gap-0.5 overflow-hidden rounded-xl border border-border/50 bg-background/90">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 px-2 py-1 text-left transition hover:bg-muted/50"
                      onClick={() => setNutritionExpanded((v) => !v)}
                      aria-expanded={nutritionExpanded}
                    >
                      <ChevronDown
                        className={cn(
                          "size-3.5 shrink-0 text-muted-foreground transition-transform",
                          nutritionExpanded && "rotate-180",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 text-[11px] font-semibold leading-tight text-foreground">
                        Ernæring
                        {nutritionActive(effectiveNutrition) ? (
                          <span className="ml-1.5 inline-flex rounded-full bg-primary/12 px-1.5 py-px text-[9px] font-semibold text-primary">
                            aktiv
                          </span>
                        ) : (
                          <span className="ml-1 font-normal text-muted-foreground">· valgfritt</span>
                        )}
                      </span>
                    </button>
                    {nutritionActive(effectiveNutrition) ? (
                      <button
                        type="button"
                        className="shrink-0 cursor-pointer px-2 text-[10px] font-medium text-muted-foreground underline-offset-2 hover:bg-muted/40 hover:text-foreground hover:underline"
                        onClick={() => {
                          setNutrition(emptyNutrition());
                          setSliding({});
                        }}
                      >
                        Nullstill
                      </button>
                    ) : null}
                  </div>
                  {nutritionExpanded ? (
                    <div
                      className="mt-1.5 max-h-[min(36vh,16rem)] space-y-1 overflow-y-auto overscroll-contain pr-0.5 pt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MinSliderRow
                        label="Kalorier (min)"
                        unit="kcal"
                        lo={bounds.kcal.min}
                        hi={bounds.kcal.max}
                        step={kcalStep}
                        minVal={effectiveNutrition.minKcal}
                        minKey="minKcal"
                        onSliderInput={onSliderInput}
                        onSliderCommit={onSliderCommit}
                        dense
                        minimal
                        showHint={false}
                      />
                      <MaxSliderRow
                        label="Kalorier (maks)"
                        unit="kcal"
                        lo={bounds.kcal.min}
                        hi={bounds.kcal.max}
                        step={kcalStep}
                        maxVal={effectiveNutrition.maxKcal}
                        maxKey="maxKcal"
                        onSliderInput={onSliderInput}
                        onSliderCommit={onSliderCommit}
                        dense
                        minimal
                        showHint={false}
                      />
                      <MinSliderRow
                        label="Protein (min)"
                        unit="g"
                        lo={bounds.protein.min}
                        hi={bounds.protein.max}
                        step={macroStep}
                        minVal={effectiveNutrition.minProtein}
                        minKey="minProtein"
                        onSliderInput={onSliderInput}
                        onSliderCommit={onSliderCommit}
                        dense
                        minimal
                        showHint={false}
                      />
                      <MaxSliderRow
                        label="Protein (maks)"
                        unit="g"
                        lo={bounds.protein.min}
                        hi={bounds.protein.max}
                        step={macroStep}
                        maxVal={effectiveNutrition.maxProtein}
                        maxKey="maxProtein"
                        onSliderInput={onSliderInput}
                        onSliderCommit={onSliderCommit}
                        dense
                        minimal
                        showHint={false}
                      />
                      <MinSliderRow
                        label="Karbohydrater (min)"
                        unit="g"
                        lo={bounds.karbs.min}
                        hi={bounds.karbs.max}
                        step={macroStep}
                        minVal={effectiveNutrition.minKarbs}
                        minKey="minKarbs"
                        onSliderInput={onSliderInput}
                        onSliderCommit={onSliderCommit}
                        dense
                        minimal
                        showHint={false}
                      />
                      <MaxSliderRow
                        label="Karbohydrater (maks)"
                        unit="g"
                        lo={bounds.karbs.min}
                        hi={bounds.karbs.max}
                        step={macroStep}
                        maxVal={effectiveNutrition.maxKarbs}
                        maxKey="maxKarbs"
                        onSliderInput={onSliderInput}
                        onSliderCommit={onSliderCommit}
                        dense
                        minimal
                        showHint={false}
                      />
                      <MinSliderRow
                        label="Fett (min)"
                        unit="g"
                        lo={bounds.fett.min}
                        hi={bounds.fett.max}
                        step={macroStep}
                        minVal={effectiveNutrition.minFett}
                        minKey="minFett"
                        onSliderInput={onSliderInput}
                        onSliderCommit={onSliderCommit}
                        dense
                        minimal
                        showHint={false}
                      />
                      <MaxSliderRow
                        label="Fett (maks)"
                        unit="g"
                        lo={bounds.fett.min}
                        hi={bounds.fett.max}
                        step={macroStep}
                        maxVal={effectiveNutrition.maxFett}
                        maxKey="maxFett"
                        onSliderInput={onSliderInput}
                        onSliderCommit={onSliderCommit}
                        dense
                        minimal
                        showHint={false}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 md:px-3" aria-busy={loading}>
                <p className="sticky top-0 z-[1] bg-background/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                  {listTitle}
                  {!loading && hits.length > 0 ? (
                    <span className="ml-1.5 font-normal tabular-nums text-muted-foreground/90">
                      ({filteredHits.length}
                      {filteredHits.length !== hits.length ? ` av ${hits.length}` : ""})
                    </span>
                  ) : null}
                </p>
                {loading ? <p className="px-2 py-4 text-sm text-muted-foreground">Laster …</p> : null}
                {!loading && hits.length === 0 ? (
                  <p className="px-2 py-4 text-sm text-muted-foreground">
                    {categoryFilter === MEAL_PLAN_PICKER_FAVORITES_VALUE
                      ? q.trim().length >= 2
                        ? "Ingen favoritter matcher søket."
                        : "Du har ingen favoritter ennå. Legg til favoritter fra en oppskriftsside."
                      : "Ingen oppskrifter i utvalget."}
                  </p>
                ) : null}
                {!loading && hits.length > 0 && filteredHits.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    Ingen oppskrifter samsvarer med ernæringsgrensene. Juster glidebryterne eller trykk Nullstill.
                  </p>
                ) : null}
                <ul className="space-y-2 pb-2">
                  {!loading &&
                    filteredHits.map((h) => {
                      const nutrition = recipeNutritionPerPortion(h);
                      return (
                      <li key={h._id}>
                        <button
                          type="button"
                          onClick={() => pick(h)}
                          className={cn(
                            "flex w-full min-h-[4.5rem] min-w-0 cursor-pointer gap-3 rounded-2xl border border-border/50 bg-card/50 p-2.5 text-left shadow-sm transition",
                            "hover:border-border hover:bg-muted/30 hover:shadow-md",
                            "active:scale-[0.99]",
                          )}
                        >
                          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted/40 ring-1 ring-border/25">
                            {h.imageUrl ? (
                              <Image
                                src={h.imageUrl}
                                alt=""
                                width={64}
                                height={64}
                                className="size-full object-cover"
                                sizes="64px"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                                —
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 py-0.5">
                            <span className="line-clamp-2 text-sm font-semibold leading-snug">{h.tittel}</span>
                            <RecipeNutritionLine
                              totalKcal={nutrition.totalKcal}
                              totalMakros={nutrition.totalMakros}
                              size="sm"
                              className="mt-1 !justify-start"
                            />
                          </div>
                        </button>
                      </li>
                    );
                    })}
                </ul>
              </div>
              <div className="shrink-0 border-t border-border/50 bg-background/95 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:rounded-b-2xl md:p-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-10 w-full cursor-pointer rounded-xl bg-secondary py-2 text-sm font-semibold transition hover:bg-secondary/90"
                >
                  Lukk
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
