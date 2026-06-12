/**
 * Måltidsplanlegger – orkestrering (TanStack Query for måltidsdata).
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MEAL_PLAN_TIMEZONE,
  addDays,
  addMonthsInPlanTz,
  buildMonthGrid,
  endOfMonth,
  localYmd,
  mondayOfWeek,
  parseYmd,
  planMonthIndex0,
  startOfMonth,
} from "@/components/plan/meal-plan-dates";
import { monthRangeForAnchor } from "@/components/plan/meal-plan-cache";
import type { MealPlanBundle } from "@/components/plan/meal-plan-cache";
import { DayPlanner } from "@/components/plan/day-planner";
import { MonthPlanner } from "@/components/plan/month-planner";
import { MealPlanSummary } from "@/components/plan/meal-plan-summary";
import { MealPlanToolbar } from "@/components/plan/meal-plan-toolbar";
import type { MealPlanCategoryOption, ViewMode } from "@/components/plan/meal-plan-types";
import { WeekPlanner } from "@/components/plan/week-planner";
import { sumMacrosFromRecipes } from "@/lib/meal-plan-macros";
import {
  useInvalidateMealPlan,
  useMealPlanMonth,
  useMealPlanRange,
  usePrefetchAdjacentMealPlanMonths,
  useVisibleMealPlanBundle,
} from "@/lib/query/meal-plan";
import type { SanityRecipe } from "@/types/page";
import type { MealPlanRow } from "@/app/actions/meal-plan";

type Props = {
  initialAnchorYmd: string;
  initialMonth?: MealPlanBundle & { from: string; to: string };
  categoryOptions: MealPlanCategoryOption[];
  mealStorageMaxDays: number | null;
};

export function MealPlanView({
  initialAnchorYmd,
  initialMonth,
  categoryOptions,
  mealStorageMaxDays,
}: Props) {
  const [view, setView] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(() => parseYmd(initialAnchorYmd));
  const [weekDayIndex, setWeekDayIndex] = useState(0);

  const monthBounds = useMemo(() => monthRangeForAnchor(anchor), [anchor]);

  const range = useMemo(() => {
    if (view === "day") {
      const d = localYmd(anchor);
      return { from: d, to: d };
    }
    if (view === "week") {
      const mon = mondayOfWeek(anchor);
      const sun = addDays(mon, 6);
      return { from: localYmd(mon), to: localYmd(sun) };
    }
    const a = startOfMonth(anchor);
    const b = endOfMonth(anchor);
    return { from: localYmd(a), to: localYmd(b) };
  }, [anchor, view]);

  const monthQuery = useMealPlanMonth(anchor, initialMonth);
  const rangeQuery = useMealPlanRange(range, monthBounds);
  usePrefetchAdjacentMealPlanMonths(anchor);
  const invalidateMealPlan = useInvalidateMealPlan();

  const bundle = useVisibleMealPlanBundle(range, monthBounds, monthQuery.data, rangeQuery.data);
  const { entries, recipes } = bundle;

  const pending =
    (monthQuery.isFetching && !monthQuery.data) || (rangeQuery.isFetching && !rangeQuery.data);

  const recipeMap = useMemo(() => {
    const m = new Map<string, SanityRecipe>();
    for (const r of recipes) m.set(r._id, r);
    return m;
  }, [recipes]);

  const totals = useMemo(() => {
    const list = entries
      .map((e) => recipeMap.get(e.recipe_sanity_id))
      .filter((r): r is SanityRecipe => Boolean(r));
    return sumMacrosFromRecipes(list);
  }, [entries, recipeMap]);

  const entriesByDate = useMemo(() => {
    const m = new Map<string, MealPlanRow[]>();
    for (const e of entries) {
      const arr = m.get(e.plan_date) ?? [];
      arr.push(e);
      m.set(e.plan_date, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.sort_order - b.sort_order);
    }
    return m;
  }, [entries]);

  const navigate = (dir: -1 | 1) => {
    if (view === "day") setAnchor((a) => addDays(a, dir));
    else if (view === "week") setAnchor((a) => addDays(a, dir * 7));
    else setAnchor((a) => addMonthsInPlanTz(a, dir));
  };

  const weekDays = useMemo(() => {
    const mon = mondayOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }, [anchor]);

  useEffect(() => {
    if (view !== "week") return;
    const mon = mondayOfWeek(anchor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
    const today = localYmd(new Date());
    const idx = days.findIndex((d) => localYmd(d) === today);
    setWeekDayIndex(idx >= 0 ? idx : 0);
  }, [view, anchor]);

  const monthGrid = useMemo(() => buildMonthGrid(anchor), [anchor]);

  const toolbarLabel = useMemo(() => {
    const tzOpts = { timeZone: MEAL_PLAN_TIMEZONE } as const;
    if (view === "month") {
      return anchor.toLocaleDateString("nb-NO", { ...tzOpts, month: "long", year: "numeric" });
    }
    if (view === "week") {
      return `Uke · ${weekDays[0].toLocaleDateString("nb-NO", { ...tzOpts, day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("nb-NO", { ...tzOpts, day: "numeric", month: "short", year: "numeric" })}`;
    }
    return anchor.toLocaleDateString("nb-NO", { ...tzOpts, weekday: "long", day: "numeric", month: "long" });
  }, [anchor, view, weekDays]);

  const dayYmd = localYmd(anchor);
  const dayEntriesSorted = useMemo(() => {
    return (entriesByDate.get(dayYmd) ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  }, [entriesByDate, dayYmd]);

  return (
    <div className="space-y-6">
      <MealPlanToolbar
        view={view}
        onViewChange={setView}
        label={toolbarLabel}
        onNavigate={navigate}
        pending={pending}
      />

      <MealPlanSummary mealCount={entries.length} totals={totals} />

      {view === "week" ? (
        <WeekPlanner
          weekDays={weekDays}
          entriesByDate={entriesByDate}
          recipeMap={recipeMap}
          categoryOptions={categoryOptions}
          mealStorageMaxDays={mealStorageMaxDays}
          onReload={invalidateMealPlan}
          selectedWeekDayIndex={weekDayIndex}
          onWeekDayIndexChange={setWeekDayIndex}
        />
      ) : null}

      {view === "month" ? (
        <MonthPlanner
          monthGrid={monthGrid}
          anchorMonth={planMonthIndex0(anchor)}
          entriesByDate={entriesByDate}
          recipeMap={recipeMap}
          categoryOptions={categoryOptions}
          mealStorageMaxDays={mealStorageMaxDays}
          onReload={invalidateMealPlan}
        />
      ) : null}

      {view === "day" ? (
        <DayPlanner
          anchor={anchor}
          dayYmd={dayYmd}
          dayEntriesSorted={dayEntriesSorted}
          recipeMap={recipeMap}
          categoryOptions={categoryOptions}
          mealStorageMaxDays={mealStorageMaxDays}
          onReload={invalidateMealPlan}
        />
      ) : null}
    </div>
  );
}
