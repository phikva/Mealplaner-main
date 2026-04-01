"use client";

import type { MealPlanRow } from "@/app/actions/meal-plan";
import { WEEKDAY_SHORT, localYmd, planDayAndMonth1, planMonthIndex0 } from "@/components/plan/meal-plan-dates";
import { MacroTotalsLine } from "@/components/plan/plan-nutrition";
import { planMonthCellEmpty, planMonthCellHasMeals } from "@/components/plan/plan-tokens";
import { AddMealPlanButton } from "@/components/plan/recipe-picker-dialog";
import type { MealPlanCategoryOption } from "@/components/plan/meal-plan-types";
import { sumMacrosFromRecipes } from "@/lib/meal-plan-macros";
import { cn } from "@/lib/utils";
import type { SanityRecipe } from "@/types/page";

type Props = {
  monthGrid: Date[];
  anchorMonth: number;
  entriesByDate: Map<string, MealPlanRow[]>;
  recipeMap: Map<string, SanityRecipe>;
  categoryOptions: MealPlanCategoryOption[];
  onReload: () => void;
};

export function MonthPlanner({
  monthGrid,
  anchorMonth,
  entriesByDate,
  recipeMap,
  categoryOptions,
  onReload,
}: Props) {
  return (
    <div className="grid grid-cols-7 gap-1.5 text-xs md:gap-2">
      {WEEKDAY_SHORT.map((w) => (
        <div key={w} className="p-1 text-center text-[11px] font-semibold text-muted-foreground md:text-xs">
          {w}
        </div>
      ))}
      {monthGrid.map((d, i) => {
        const ymd = localYmd(d);
        const inMonth = planMonthIndex0(d) === anchorMonth;
        const dayEntries = entriesByDate.get(ymd) ?? [];
        const hasMeals = dayEntries.length > 0;
        const dayTotals = sumMacrosFromRecipes(
          dayEntries.map((e) => recipeMap.get(e.recipe_sanity_id)).filter((r): r is SanityRecipe => Boolean(r)),
        );
        return (
          <div
            key={`${ymd}-${i}`}
            className={cn(
              "relative flex min-h-[7.25rem] flex-col rounded-xl border p-1.5 md:min-h-[8rem] md:p-2",
              inMonth && hasMeals && planMonthCellHasMeals,
              inMonth && !hasMeals && planMonthCellEmpty,
              !inMonth && "border-transparent bg-muted/20 opacity-50",
            )}
          >
            <div className="flex items-start justify-between gap-1">
              <p
                className={cn(
                  "text-[10px] tabular-nums md:text-xs",
                  inMonth && hasMeals && "font-bold text-foreground",
                  inMonth && !hasMeals && "font-semibold text-muted-foreground",
                  !inMonth && "text-muted-foreground",
                )}
              >
                {planDayAndMonth1(d).day}
              </p>
              {inMonth && hasMeals ? (
                <span
                  className="mt-0.5 size-2 shrink-0 rounded-full bg-accent-foreground/35 shadow-[0_0_0_2px] shadow-background"
                  title={`${dayEntries.length} måltid`}
                  aria-hidden
                />
              ) : null}
            </div>
            <div className="mt-1 min-h-[2.5rem] flex-1">
              {hasMeals ? (
                <MacroTotalsLine totals={dayTotals} size="xs" className="line-clamp-3 text-left leading-tight" />
              ) : (
                <p className="text-[10px] text-muted-foreground/70">—</p>
              )}
            </div>
            <p
              className={cn(
                "mt-auto pt-0.5 text-[10px] font-semibold tabular-nums md:text-[11px]",
                hasMeals ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {dayEntries.length} målt.
            </p>
            <AddMealPlanButton planDate={ymd} categoryOptions={categoryOptions} onAdded={onReload} compact />
          </div>
        );
      })}
    </div>
  );
}
