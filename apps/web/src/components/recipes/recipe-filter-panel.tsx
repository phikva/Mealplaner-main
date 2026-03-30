"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { getCategoryTagClassName } from "@/lib/category-tags";
import { cn } from "@/lib/utils";
import type {
  RecipeFilterBounds,
  RecipeFilterOptions,
  RecipeFilterState,
} from "@/lib/recipes/recipe-filters";

/** Kun maks-glidebrytere (én per næringsstoff). */
export type RecipeSliderKey = "maxKcal" | "maxProtein" | "maxKarbs" | "maxFett";

type FilterTabId = "category" | "prefs" | "nutrition";

type Props = {
  options: RecipeFilterOptions;
  bounds: RecipeFilterBounds;
  committedFilters: RecipeFilterState;
  displayFilters: RecipeFilterState;
  qDraft: string;
  onQDraftChange: (value: string) => void;
  onCategoryToggle: (categoryId: string) => void;
  onDietToggle: (verdi: string) => void;
  onAllergenToggle: (navn: string) => void;
  onSliderInput: (key: RecipeSliderKey, value: number) => void;
  onSliderCommit: (key: RecipeSliderKey, raw: number) => void;
  onClear: () => void;
  activeFilterCount: number;
  layout: "inline" | "sheet";
  sheetFooter?: ReactNode;
};

function formatNum(n: number, decimals: number) {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function tabHasActivity(id: FilterTabId, committed: RecipeFilterState): boolean {
  switch (id) {
    case "category":
      return committed.categoryIds.length > 0;
    case "prefs":
      return committed.diets.length > 0 || committed.excludeAllergens.length > 0;
    case "nutrition":
      return (
        committed.maxKcal !== null ||
        committed.maxProtein !== null ||
        committed.maxKarbs !== null ||
        committed.maxFett !== null
      );
    default:
      return false;
  }
}

function MaxSliderRow({
  label,
  unit,
  lo,
  hi,
  step,
  maxVal,
  maxKey,
  onSliderInput,
  onSliderCommit,
  dense = false,
  showHint = true,
}: {
  label: string;
  unit: string;
  lo: number;
  hi: number;
  step: number;
  maxVal: number | null;
  maxKey: RecipeSliderKey;
  onSliderInput: (key: RecipeSliderKey, value: number) => void;
  onSliderCommit: (key: RecipeSliderKey, raw: number) => void;
  /** Kompakt rad (makro-grid): mindre type, kortere hjelpetekst. */
  dense?: boolean;
  /** Vis forklaring under slideren (kalorier) eller skjul (makroer – forklaring står én gang). */
  showHint?: boolean;
}) {
  const shown = maxVal === null ? hi : Math.min(maxVal, hi);
  const rangeClass =
    "h-2 w-full min-w-0 cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:shrink-0 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm active:[&::-webkit-slider-thumb]:cursor-grabbing";

  const finish = (el: HTMLInputElement) => {
    onSliderCommit(maxKey, Number(el.value));
  };

  const decimals = step < 1 ? 1 : 0;
  const hint =
    "Dra mot venstre for å sette maks. Helt til høyre = ingen øvre grense.";
  const ariaHint = maxVal === null ? "ingen øvre grense" : `maks ${formatNum(maxVal, decimals)} ${unit}`;

  return (
    <div className={cn(dense ? "min-w-0 space-y-1.5" : "space-y-2")}>
      <div className="flex min-w-0 items-baseline justify-between gap-2">
        <p
          className={cn(
            "min-w-0 font-medium text-foreground",
            dense ? "truncate text-xs" : "text-sm",
          )}
        >
          {label}
        </p>
        <div className="shrink-0 text-right">
          <span className={cn("text-muted-foreground", dense ? "text-[10px]" : "text-[11px]")}>
            Maks{" "}
          </span>
          <span className={cn("tabular-nums font-semibold text-foreground", dense ? "text-xs" : "text-sm")}>
            {maxVal === null ? (
              <span className="font-normal text-muted-foreground">–</span>
            ) : (
              <>
                {formatNum(maxVal, decimals)} {unit}
              </>
            )}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={lo}
        max={hi}
        step={step}
        value={shown}
        aria-label={`Maks ${label}. ${ariaHint}. ${hint}`}
        title={hint}
        onInput={(e) => onSliderInput(maxKey, Number(e.currentTarget.value))}
        onPointerUp={(e) => finish(e.currentTarget)}
        onPointerCancel={(e) => finish(e.currentTarget)}
        onBlur={(e) => finish(e.currentTarget)}
        className={cn(rangeClass, "touch-none")}
      />
      {showHint ? (
        <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function RecipeFilterPanel({
  options,
  bounds,
  committedFilters,
  displayFilters,
  qDraft,
  onQDraftChange,
  onCategoryToggle,
  onDietToggle,
  onAllergenToggle,
  onSliderInput,
  onSliderCommit,
  onClear,
  activeFilterCount,
  layout,
  sheetFooter,
}: Props) {
  const showDiet = options.diets.length > 0;
  const showAllergens = options.allergens.length > 0;
  const showPrefs = showDiet || showAllergens;
  const showCategory = options.categories.length > 0;
  const kcalSpan = bounds.kcal.max - bounds.kcal.min;
  const kcalStep = kcalSpan > 800 ? 25 : kcalSpan > 200 ? 10 : 1;
  const macroStep = 1;
  const isSheet = layout === "sheet";

  const tabList = useMemo(() => {
    const list: { id: FilterTabId; label: string }[] = [];
    if (showCategory) list.push({ id: "category", label: "Kategori" });
    if (showPrefs) list.push({ id: "prefs", label: "Kosthold & allergener" });
    list.push({ id: "nutrition", label: "Ernæring" });
    return list;
  }, [showCategory, showPrefs]);

  const [activeTab, setActiveTab] = useState<FilterTabId>("nutrition");

  useEffect(() => {
    const ids = tabList.map((t) => t.id);
    if (!ids.includes(activeTab)) {
      setActiveTab(ids[0] ?? "nutrition");
    }
  }, [tabList, activeTab]);

  const tablistClass = cn(
    "flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    isSheet ? "" : "md:gap-2",
  );

  const stickyWrap = cn(
    "shrink-0 space-y-2",
    isSheet
      ? "sticky top-0 z-[1] border-b border-border/40 bg-background/95 px-3 py-2 backdrop-blur-md"
      : "border-b border-border/40 px-3 py-2.5 md:px-4",
  );

  return (
    <div
      className={cn(
        "flex flex-col",
        isSheet
          ? "min-h-0 flex-1 overflow-hidden bg-card/50 pt-1"
          : "overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-sm",
      )}
    >
      <div className={stickyWrap}>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="recipe-filter-search">
            Søk
          </label>
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="recipe-filter-search"
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              placeholder="Søk …"
              value={qDraft}
              onChange={(e) => onQDraftChange(e.target.value)}
              className="h-9 w-full rounded-lg border border-border/60 bg-background py-1.5 pr-2 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-border/60 px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Nullstill
              <span className="ml-1 tabular-nums text-muted-foreground/90">({activeFilterCount})</span>
            </button>
          ) : null}
        </div>

        <div role="tablist" aria-label="Filter" className={tablistClass}>
          {tabList.map(({ id, label }) => {
            const active = activeTab === id;
            const hasDot = tabHasActivity(id, committedFilters);
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                id={`filter-tab-${id}`}
                aria-controls={`filter-panel-${id}`}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "relative shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors md:px-3.5 md:py-2 md:text-sm",
                  active
                    ? "border-primary/40 bg-primary/12 text-primary"
                    : "border-border/60 bg-background text-foreground hover:bg-muted",
                )}
              >
                {label}
                {hasDot ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-primary"
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-y-auto",
          isSheet
            ? cn("px-3 pt-3", sheetFooter ? "pb-28 md:pb-4" : "pb-3")
            : "p-3 pt-2 md:p-4 md:pt-3",
        )}
      >
        {activeTab === "category" && showCategory ? (
          <div
            role="tabpanel"
            id="filter-panel-category"
            aria-labelledby="filter-tab-category"
            className="animate-in fade-in duration-150 space-y-3"
          >
            <p className="text-sm text-muted-foreground">
              Vis oppskrifter som hører til minst én valgt kategori.
            </p>
            <div className="flex flex-wrap gap-2">
              {options.categories.map((c) => {
                const activeChip = committedFilters.categoryIds.includes(c._id);
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => onCategoryToggle(c._id)}
                    className={cn(
                      "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                      activeChip
                        ? "border-primary/30 bg-primary/12 text-primary ring-2 ring-primary/25"
                        : getCategoryTagClassName(c.name),
                    )}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeTab === "prefs" && showPrefs ? (
          <div
            role="tabpanel"
            id="filter-panel-prefs"
            aria-labelledby="filter-tab-prefs"
            className="animate-in fade-in duration-150 space-y-8"
          >
            {showDiet ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Kosthold</p>
                <p className="text-sm text-muted-foreground">Velg ett eller flere.</p>
                <div className="flex flex-wrap gap-2">
                  {options.diets.map((o) => {
                    const activeChip = committedFilters.diets.includes(o.verdi);
                    return (
                      <button
                        key={o.verdi}
                        type="button"
                        onClick={() => onDietToggle(o.verdi)}
                        className={cn(
                          "rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                          activeChip
                            ? "border-primary/40 bg-primary/12 text-primary"
                            : "border-border/60 bg-background hover:bg-muted",
                        )}
                      >
                        {o.navn}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {showAllergens ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Allergener</p>
                <p className="text-sm text-muted-foreground">Skjul oppskrifter som inneholder …</p>
                <div className="flex flex-wrap gap-2">
                  {options.allergens.map((o) => {
                    const activeChip = committedFilters.excludeAllergens.includes(o.navn);
                    return (
                      <button
                        key={o.navn}
                        type="button"
                        onClick={() => onAllergenToggle(o.navn)}
                        className={cn(
                          "rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                          activeChip
                            ? "border-destructive/40 bg-destructive/10 text-destructive"
                            : "border-border/60 bg-background hover:bg-muted",
                        )}
                      >
                        {o.navn}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "nutrition" ? (
          <div
            role="tabpanel"
            id="filter-panel-nutrition"
            aria-labelledby="filter-tab-nutrition"
            className="animate-in fade-in duration-150 space-y-6"
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Kalorier
              </p>
              <MaxSliderRow
                label="Totalt (oppskrift)"
                unit="kcal"
                lo={0}
                hi={bounds.kcal.max}
                step={kcalStep}
                maxVal={displayFilters.maxKcal}
                maxKey="maxKcal"
                onSliderInput={onSliderInput}
                onSliderCommit={onSliderCommit}
              />
            </div>
            <div className="space-y-3 border-t border-border/40 pt-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Makro (totalt)
                </p>
                <p className="max-w-full text-[11px] leading-snug text-muted-foreground">
                  Høyre = ingen tak · venstre = maks
                </p>
              </div>
              <div className="grid min-w-0 grid-cols-3 gap-3">
                <MaxSliderRow
                  label="Protein"
                  unit="g"
                  lo={0}
                  hi={bounds.protein.max}
                  step={macroStep}
                  maxVal={displayFilters.maxProtein}
                  maxKey="maxProtein"
                  dense
                  showHint={false}
                  onSliderInput={onSliderInput}
                  onSliderCommit={onSliderCommit}
                />
                <MaxSliderRow
                  label="Karbo"
                  unit="g"
                  lo={0}
                  hi={bounds.karbs.max}
                  step={macroStep}
                  maxVal={displayFilters.maxKarbs}
                  maxKey="maxKarbs"
                  dense
                  showHint={false}
                  onSliderInput={onSliderInput}
                  onSliderCommit={onSliderCommit}
                />
                <MaxSliderRow
                  label="Fett"
                  unit="g"
                  lo={0}
                  hi={bounds.fett.max}
                  step={macroStep}
                  maxVal={displayFilters.maxFett}
                  maxKey="maxFett"
                  dense
                  showHint={false}
                  onSliderInput={onSliderInput}
                  onSliderCommit={onSliderCommit}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {sheetFooter}
    </div>
  );
}

export function RecipeFilterTriggerButton({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 min-w-[7.5rem] flex-1 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background px-4 text-sm font-semibold shadow-sm transition hover:bg-muted sm:flex-none"
    >
      <SlidersHorizontal className="size-4 shrink-0" aria-hidden />
      Filter
      {count > 0 ? (
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary tabular-nums">
          {count}
        </span>
      ) : null}
    </button>
  );
}
