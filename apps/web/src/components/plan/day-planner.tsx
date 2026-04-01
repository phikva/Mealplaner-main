"use client";

import { Copy, Trash2 } from "lucide-react";
import type { MealPlanRow } from "@/app/actions/meal-plan";
import { removeAllMealPlanEntriesForDateAction, removeMealPlanEntryAction } from "@/app/actions/meal-plan";
import { MealEntryCard } from "@/components/plan/meal-entry-card";
import { MealDayCopySheet } from "@/components/plan/meal-day-copy-sheet";
import { MacroTotalsLine } from "@/components/plan/plan-nutrition";
import {
  planSurfaceCard,
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
import { useState } from "react";

type Props = {
  anchor: Date;
  dayYmd: string;
  dayEntriesSorted: MealPlanRow[];
  recipeMap: Map<string, SanityRecipe>;
  categoryOptions: MealPlanCategoryOption[];
  onReload: () => void;
};

export function DayPlanner({ anchor, dayYmd, dayEntriesSorted, recipeMap, categoryOptions, onReload }: Props) {
  const [copyDayOpen, setCopyDayOpen] = useState(false);
  const dayTotals = sumMacrosFromRecipes(
    dayEntriesSorted.map((e) => recipeMap.get(e.recipe_sanity_id)).filter((r): r is SanityRecipe => Boolean(r)),
  );
  const hasMeals = dayEntriesSorted.length > 0;

  function clearAllMealsForDay() {
    const n = dayEntriesSorted.length;
    if (
      n <= 0 ||
      !window.confirm(
        n === 1
          ? "Slette måltidet denne dagen? Dette kan ikke angres."
          : `Slette alle ${n} måltider denne dagen? Dette kan ikke angres.`,
      )
    ) {
      return;
    }
    void removeAllMealPlanEntriesForDateAction(dayYmd).then((res) => {
      if (res.ok) onReload();
    });
  }

  return (
    <section className={cn(planSurfaceCard, "space-y-6 p-4 md:p-6")}>
      <div className="space-y-4 border-b border-border/45 pb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
            {anchor.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {hasMeals ? `${dayEntriesSorted.length} måltid` : "Ingen måltid"}
          </p>
        </div>
        {hasMeals ? (
          <div className={planWeekDayMergedCard}>
            <div className={cn(planWeekDayMergedCardHeader, "border-b border-border/40")}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sum for dagen
              </p>
            </div>
            <div className={planWeekDayMergedCardBody}>
              <MacroTotalsLine totals={dayTotals} size="md" className="leading-snug" />
              <div className="mt-3 flex flex-col gap-2 border-t border-secondary/25 pt-3 dark:border-secondary/20 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full gap-2 rounded-xl text-xs font-semibold sm:w-auto sm:min-w-[10rem]"
                  onClick={() => setCopyDayOpen(true)}
                >
                  <Copy className="size-3.5 shrink-0" />
                  Kopier dag
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full gap-2 rounded-xl border-destructive/40 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto sm:min-w-[10rem] dark:border-destructive/50"
                  onClick={clearAllMealsForDay}
                  aria-label="Slett alle måltider for denne dagen"
                >
                  <Trash2 className="size-3.5 shrink-0" />
                  Slett alle måltider
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {!hasMeals ? (
          <p className="text-sm text-muted-foreground">Ingen måltid ennå. Legg til under.</p>
        ) : (
          dayEntriesSorted.map((e, i) => (
            <MealEntryCard
              key={e.id}
              entry={e}
              mealDisplayIndex={i + 1}
              recipe={recipeMap.get(e.recipe_sanity_id)}
              onRemove={() => removeMealPlanEntryAction(e.id).then(() => onReload())}
              onCopied={onReload}
              compactThumb
              dayListLayout
            />
          ))
        )}
      </div>

      <AddMealPlanButton planDate={dayYmd} categoryOptions={categoryOptions} onAdded={onReload} />
      <MealDayCopySheet
        open={copyDayOpen}
        onOpenChange={setCopyDayOpen}
        sourcePlanDate={dayYmd}
        mealCount={dayEntriesSorted.length}
        onCopied={onReload}
      />
    </section>
  );
}
