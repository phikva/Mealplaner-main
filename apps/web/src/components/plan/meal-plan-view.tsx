/**
 * Måltidsplanlegger – orkestrering.
 *
 * Mulige forbedringer (UX): sort_order etter sletting; dra/sorter; toast; URL-state; skeleton.
 */
"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  getMealPlanWithRecipesAction,
  type MealPlanRow,
} from "@/app/actions/meal-plan";
import { toast } from "sonner";
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
import { DayPlanner } from "@/components/plan/day-planner";
import { MonthPlanner } from "@/components/plan/month-planner";
import { MealPlanSummary } from "@/components/plan/meal-plan-summary";
import { MealPlanToolbar } from "@/components/plan/meal-plan-toolbar";
import type { MealPlanCategoryOption, ViewMode } from "@/components/plan/meal-plan-types";
import { WeekPlanner } from "@/components/plan/week-planner";
import { sumMacrosFromRecipes } from "@/lib/meal-plan-macros";
import type { SanityRecipe } from "@/types/page";

type Props = {
  initialFrom: string;
  initialEntries: MealPlanRow[];
  initialRecipes: SanityRecipe[];
  categoryOptions: MealPlanCategoryOption[];
  /** Fra Sanity tier.mealStorage – null = uendelig (Premium). */
  mealStorageMaxDays: number | null;
};

export function MealPlanView({
  initialFrom,
  initialEntries,
  initialRecipes,
  categoryOptions,
  mealStorageMaxDays,
}: Props) {
  const [view, setView] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(() => parseYmd(initialFrom));
  const [entries, setEntries] = useState<MealPlanRow[]>(initialEntries);
  const [recipes, setRecipes] = useState<SanityRecipe[]>(initialRecipes);
  const [pending, startTransition] = useTransition();
  const [weekDayIndex, setWeekDayIndex] = useState(0);

  const recipeMap = useMemo(() => {
    const m = new Map<string, SanityRecipe>();
    for (const r of recipes) m.set(r._id, r);
    return m;
  }, [recipes]);

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

  const load = useCallback(() => {
    startTransition(async () => {
      const res = await getMealPlanWithRecipesAction(range.from, range.to);
      if (!res.ok) {
        if (res.error === "query_failed") {
          toast.error("Kunne ikke laste måltidsplan. Prøv igjen.");
        }
        return;
      }
      setEntries(res.entries);
      setRecipes(res.recipes);
    });
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

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
          onReload={load}
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
          onReload={load}
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
          onReload={load}
        />
      ) : null}
    </div>
  );
}
