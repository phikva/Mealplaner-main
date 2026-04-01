"use client";

import { Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import type { MealPlanRow } from "@/app/actions/meal-plan";
import { removeAllMealPlanEntriesForDateAction, removeMealPlanEntryAction } from "@/app/actions/meal-plan";
import { MealEntryCard } from "@/components/plan/meal-entry-card";
import { MealDayCopySheet } from "@/components/plan/meal-day-copy-sheet";
import { WEEKDAY_SHORT, localYmd, planDayAndMonth1, planWeekdayMon0 } from "@/components/plan/meal-plan-dates";
import { MacroTotalsLine } from "@/components/plan/plan-nutrition";
import {
  planDayColumnClass,
  planDayHeader,
  planWeekDayMergedCard,
  planWeekDayMergedCardBody,
  planWeekDayMergedCardHeader,
} from "@/components/plan/plan-tokens";
import { Button } from "@/components/ui/button";
import { AddMealPlanButton } from "@/components/plan/recipe-picker-dialog";
import type { MealPlanCategoryOption } from "@/components/plan/meal-plan-types";
import { sumMacrosFromRecipes } from "@/lib/meal-plan-macros";
import { cn } from "@/lib/utils";
import type { SanityRecipe } from "@/types/page";

type Props = {
  weekDays: Date[];
  entriesByDate: Map<string, MealPlanRow[]>;
  recipeMap: Map<string, SanityRecipe>;
  categoryOptions: MealPlanCategoryOption[];
  onReload: () => void;
  selectedWeekDayIndex: number;
  onWeekDayIndexChange: (index: number) => void;
};

function dayTotalsFor(
  dayEntries: MealPlanRow[],
  recipeMap: Map<string, SanityRecipe>,
) {
  return sumMacrosFromRecipes(
    dayEntries.map((e) => recipeMap.get(e.recipe_sanity_id)).filter((r): r is SanityRecipe => Boolean(r)),
  );
}

export function WeekPlanner({
  weekDays,
  entriesByDate,
  recipeMap,
  categoryOptions,
  onReload,
  selectedWeekDayIndex,
  onWeekDayIndexChange,
}: Props) {
  const [copyDayOpen, setCopyDayOpen] = useState(false);
  const selectedDate = weekDays[selectedWeekDayIndex] ?? weekDays[0];
  const selectedYmd = localYmd(selectedDate);

  const selectedDayEntries = entriesByDate.get(selectedYmd) ?? [];
  const selectedTotals = dayTotalsFor(selectedDayEntries, recipeMap);
  const selectedHasMeals = selectedDayEntries.length > 0;
  const selectedWeekdayShort = WEEKDAY_SHORT[planWeekdayMon0(weekDays[selectedWeekDayIndex] ?? weekDays[0])];

  const openCopyDayForYmd = (ymd: string) => {
    setCopyDayOpen(true);
    const idx = weekDays.findIndex((x) => localYmd(x) === ymd);
    if (idx >= 0) onWeekDayIndexChange(idx);
  };

  function clearAllMealsForDay(planDate: string, mealCount: number) {
    if (
      mealCount <= 0 ||
      !window.confirm(
        mealCount === 1
          ? "Slette måltidet denne dagen? Dette kan ikke angres."
          : `Slette alle ${mealCount} måltider denne dagen? Dette kan ikke angres.`,
      )
    ) {
      return;
    }
    void removeAllMealPlanEntriesForDateAction(planDate).then((res) => {
      if (res.ok) onReload();
    });
  }

  return (
    <>
      {/* Mobil: dagsvelger + én dag */}
      <div className="space-y-3 md:hidden">
        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Velg dag i uken"
        >
          {weekDays.map((d, i) => {
            const ymd = localYmd(d);
            const n = (entriesByDate.get(ymd) ?? []).length;
            const active = i === selectedWeekDayIndex;
            return (
              <button
                key={ymd}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onWeekDayIndexChange(i)}
                className={cn(
                  "shrink-0 cursor-pointer rounded-xl px-3 py-2 text-left transition active:scale-[0.99]",
                  active
                    ? "border border-border/70 bg-accent/[0.14] ring-1 ring-border/40"
                    : cn(planDayHeader, "hover:bg-accent/[0.12]"),
                )}
              >
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {WEEKDAY_SHORT[planWeekdayMon0(d)]}
                </span>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-base font-bold tabular-nums leading-none">{planDayAndMonth1(d).day}</span>
                  {n > 0 ? (
                    <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{n}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className={cn(planDayColumnClass(selectedHasMeals, "open"), "min-h-0")}>
          <div className={planWeekDayMergedCard}>
            <div
              className={cn(
                planWeekDayMergedCardHeader,
                selectedHasMeals && "border-b border-border/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {selectedWeekdayShort}{" "}
                  <span className="font-normal text-muted-foreground">
                    {planDayAndMonth1(selectedDate).day}.{planDayAndMonth1(selectedDate).month1}
                  </span>
                </p>
                <span className="text-xs text-muted-foreground">
                  {selectedHasMeals ? `${selectedDayEntries.length} måltid` : "Tom"}
                </span>
              </div>
            </div>

            {selectedHasMeals ? (
              <div className={planWeekDayMergedCardBody}>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-secondary-foreground/85">
                  Sum for dagen
                </p>
                <MacroTotalsLine totals={selectedTotals} size="xs" className="mt-0.5 leading-tight" />
                <div className="mt-2 flex flex-col gap-2 border-t border-secondary/25 pt-2 dark:border-secondary/20">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-full gap-2 rounded-xl text-xs font-semibold"
                    onClick={() => setCopyDayOpen(true)}
                  >
                    <Copy className="size-3.5 shrink-0" />
                    Kopier dag
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-full gap-2 rounded-xl border-destructive/40 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/50"
                    onClick={() => clearAllMealsForDay(selectedYmd, selectedDayEntries.length)}
                    aria-label="Slett alle måltider for denne dagen"
                  >
                    <Trash2 className="size-3.5 shrink-0" />
                    Slett alle måltider
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex min-h-[8rem] flex-1 flex-col gap-4">
            {!selectedHasMeals ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Ingen måltid denne dagen.</p>
            ) : (
              selectedDayEntries.map((e, i) => (
                <MealEntryCard
                  key={e.id}
                  entry={e}
                  mealDisplayIndex={i + 1}
                  recipe={recipeMap.get(e.recipe_sanity_id)}
                  onRemove={() => removeMealPlanEntryAction(e.id).then(() => onReload())}
                  onCopied={onReload}
                  compactThumb
                />
              ))
            )}
          </div>
          <AddMealPlanButton planDate={selectedYmd} categoryOptions={categoryOptions} onAdded={onReload} />
        </div>
      </div>
      <MealDayCopySheet
        open={copyDayOpen}
        onOpenChange={setCopyDayOpen}
        sourcePlanDate={selectedYmd}
        mealCount={selectedDayEntries.length}
        onCopied={onReload}
      />

      {/* Desktop: 7 kolonner */}
      <div className="hidden md:grid md:grid-cols-7 md:gap-4">
        {weekDays.map((d) => {
          const ymd = localYmd(d);
          const dayEntries = entriesByDate.get(ymd) ?? [];
          const hasDayMeals = dayEntries.length > 0;
          const dayTotals = dayTotalsFor(dayEntries, recipeMap);
          return (
            <div key={ymd} className={planDayColumnClass(hasDayMeals, "open")}>
              <div className={planWeekDayMergedCard}>
                <div
                  className={cn(
                    planWeekDayMergedCardHeader,
                    hasDayMeals && "border-b border-border/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {WEEKDAY_SHORT[planWeekdayMon0(d)]} {planDayAndMonth1(d).day}.{planDayAndMonth1(d).month1}
                    </p>
                    {hasDayMeals ? (
                      <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                        {dayEntries.length}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/80">—</span>
                    )}
                  </div>
                </div>

                {hasDayMeals ? (
                  <div className={planWeekDayMergedCardBody}>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-secondary-foreground/85">Sum</p>
                    <MacroTotalsLine totals={dayTotals} size="xs" className="mt-0.5 leading-tight" />
                    <div className="mt-2 flex flex-col gap-2 border-t border-secondary/25 pt-2 dark:border-secondary/20">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-full gap-1 rounded-xl px-2 text-[10px] font-semibold leading-tight"
                        onClick={() => openCopyDayForYmd(ymd)}
                      >
                        <Copy className="size-3 shrink-0" />
                        Kopier dag
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-full gap-1 rounded-xl border-destructive/40 px-2 text-[10px] font-semibold leading-tight text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/50"
                        onClick={() => clearAllMealsForDay(ymd, dayEntries.length)}
                        aria-label="Slett alle måltider denne dagen"
                      >
                        <Trash2 className="size-3 shrink-0" />
                        Slett alle måltider
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto">
                {dayEntries.length === 0 ? (
                  <p className="py-2 text-center text-[11px] text-muted-foreground">Tomt</p>
                ) : (
                  dayEntries.map((e, i) => (
                    <MealEntryCard
                      key={e.id}
                      entry={e}
                      mealDisplayIndex={i + 1}
                      recipe={recipeMap.get(e.recipe_sanity_id)}
                      onRemove={() => removeMealPlanEntryAction(e.id).then(() => onReload())}
                      onCopied={onReload}
                      compactThumb
                    />
                  ))
                )}
              </div>
              <AddMealPlanButton planDate={ymd} categoryOptions={categoryOptions} onAdded={onReload} />
            </div>
          );
        })}
      </div>
    </>
  );
}
