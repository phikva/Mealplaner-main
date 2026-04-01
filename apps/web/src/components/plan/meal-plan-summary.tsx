"use client";

import type { MacroTotals } from "@/lib/meal-plan-macros";
import { macroKcalFromGrams } from "@/lib/meal-plan-macros";
import { MacroDonutChart, macroDonutSegmentColors } from "@/components/plan/macro-donut-chart";
import { planSummaryPanel, planSurfaceCard } from "@/components/plan/plan-tokens";
import { MacroTotalsLine } from "@/components/plan/plan-nutrition";
import { cn } from "@/lib/utils";

type Props = {
  mealCount: number;
  totals: MacroTotals;
};

function energyPct(part: number, sum: number): number {
  if (sum <= 0) return 0;
  return Math.round((part / sum) * 100);
}

export function MealPlanSummary({ mealCount, totals }: Props) {
  const { protein: pKcal, karbs: kKcal, fett: fKcal, sum: kcalSum } = macroKcalFromGrams(totals);
  const hasSplit = kcalSum > 0;

  const legendRows = hasSplit
    ? (
        [
          {
            label: "Protein",
            color: macroDonutSegmentColors.protein,
            pct: energyPct(pKcal, kcalSum),
            grams: totals.protein,
          },
          {
            label: "Karbohydrater",
            color: macroDonutSegmentColors.karbs,
            pct: energyPct(kKcal, kcalSum),
            grams: totals.karbs,
          },
          {
            label: "Fett",
            color: macroDonutSegmentColors.fett,
            pct: energyPct(fKcal, kcalSum),
            grams: totals.fett,
          },
        ] as const
      )
    : [];

  const kcalRounded = totals.kcal > 0 ? Math.round(totals.kcal) : kcalSum > 0 ? Math.round(kcalSum) : 0;

  return (
    <section className={cn(planSurfaceCard, "p-4 md:p-5")}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8">
        <div className={cn("min-w-0 space-y-1 lg:max-w-md", planSummaryPanel)}>
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">Totalt i perioden</p>
          <p className="text-sm text-muted-foreground">
            {mealCount} måltid{mealCount === 1 ? "" : "er"}
          </p>
          {kcalRounded > 0 ? (
            <p className="pt-2 text-3xl font-bold tabular-nums tracking-tight text-foreground md:text-4xl">
              {kcalRounded}
              <span className="ml-1.5 text-lg font-semibold text-muted-foreground md:text-xl">kcal</span>
            </p>
          ) : (
            <p className="pt-1 text-sm text-muted-foreground">Ingen kaloridata i perioden.</p>
          )}
          <p
            className="max-w-sm pt-2 text-[11px] leading-snug text-muted-foreground"
            title="Energifordeling fra gram protein og karbohydrat (4 kcal/g) og fett (9 kcal/g)."
          >
            Diagrammet viser fordeling av energi fra makroene (4–4–9). Midten = oppsumerte kcal fra oppskriftene.
          </p>
        </div>

        <div
          className={cn(
            planSummaryPanel,
            "grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-0 sm:flex sm:shrink-0 sm:flex-row sm:items-start sm:gap-6 lg:w-auto lg:shrink-0 lg:items-center",
          )}
        >
          <div className="flex justify-center sm:block sm:shrink-0">
            <MacroDonutChart totals={totals} size="md" showFooterLegend={false} className="gap-0" />
          </div>
          <div className="min-w-0 sm:w-auto">
            {hasSplit ? (
              <ul className="w-full space-y-1.5 sm:max-w-[14rem] sm:space-y-2">
                {legendRows.map((row) => (
                  <li key={row.label} className="flex items-start gap-2 text-[13px] sm:gap-2.5 sm:text-sm">
                    <span
                      className="mt-1 size-2 shrink-0 rounded-full sm:mt-1.5"
                      style={{ backgroundColor: row.color }}
                      aria-hidden
                    />
                    <div className="min-w-0 leading-tight">
                      <span className="font-medium text-foreground">{row.label}</span>
                      <span className="mt-0.5 block text-[11px] tabular-nums text-muted-foreground sm:text-xs">
                        {row.pct}% · {Math.round(row.grams)} g
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {!hasSplit && (totals.kcal > 0 || totals.protein > 0 || totals.karbs > 0 || totals.fett > 0) ? (
              <div className="mt-2 text-left sm:mt-0 sm:text-left">
                <MacroTotalsLine totals={totals} size="sm" className="text-muted-foreground sm:justify-start" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
