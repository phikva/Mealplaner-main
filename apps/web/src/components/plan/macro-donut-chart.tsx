"use client";

import type { MacroTotals } from "@/lib/meal-plan-macros";
import { macroKcalFromGrams } from "@/lib/meal-plan-macros";
import { cn } from "@/lib/utils";

/** Samme farger som i conic-gradient (for legend utenfor diagrammet) */
export const macroDonutSegmentColors = {
  protein: "oklch(0.74 0.11 250)", // soft indigo
  karbs: "oklch(0.78 0.12 155)", // mint
  fett: "oklch(0.8 0.11 85)", // warm sand
} as const;

const COL = macroDonutSegmentColors;

type Props = {
  totals: MacroTotals;
  className?: string;
  size?: "sm" | "md";
  /** Standard: prosentrad under donut. Sett false når legend tegnes ved siden av (f.eks. sammendrag). */
  showFooterLegend?: boolean;
};

function pct(part: number, sum: number): number {
  if (sum <= 0) return 0;
  return Math.round((part / sum) * 100);
}

/** Donut som viser energifordeling fra P/K/F (4–4–9). Midten: oppsumert kcal fra data. */
export function MacroDonutChart({ totals, className, size = "md", showFooterLegend = true }: Props) {
  const { protein, karbs, fett, sum } = macroKcalFromGrams(totals);
  const outer = size === "sm" ? "size-[4.5rem]" : "size-[5.75rem]";
  const innerPct = size === "sm" ? "22%" : "20%";

  if (sum <= 0 && totals.kcal <= 0) {
    return (
      <div
        className={cn(
          outer,
          "flex shrink-0 items-center justify-center rounded-full border border-dashed border-border/60 bg-muted/20 text-center text-[10px] text-muted-foreground",
          className,
        )}
        aria-hidden
      >
        —
      </div>
    );
  }

  let pDeg = 0;
  let kDeg = 0;
  if (sum > 0) {
    pDeg = (protein / sum) * 360;
    kDeg = (karbs / sum) * 360;
  }

  const gradient =
    sum > 0
      ? `conic-gradient(${COL.protein} 0deg ${pDeg}deg, ${COL.karbs} ${pDeg}deg ${pDeg + kDeg}deg, ${COL.fett} ${pDeg + kDeg}deg 360deg)`
      : `conic-gradient(oklch(0.75 0.02 250 / 35%) 0deg 360deg)`;

  const kcalLabel = totals.kcal > 0 ? Math.round(totals.kcal) : sum > 0 ? Math.round(sum) : 0;
  const aria = [
    `Fordeling av energi fra makroer: protein ${pct(protein, sum)} prosent,`,
    `karbohydrater ${pct(karbs, sum)} prosent, fett ${pct(fett, sum)} prosent.`,
    kcalLabel ? `Ca ${kcalLabel} kilokalorier.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("flex shrink-0 flex-col items-center gap-2", className)}>
      <div className={cn("relative", outer)} role="img" aria-label={aria}>
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: gradient }}
        />
        <div
          className="absolute rounded-full bg-background shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--border)_45%,transparent)]"
          style={{
            inset: innerPct,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold tabular-nums text-foreground", size === "sm" ? "text-xs" : "text-sm")}>
            {kcalLabel > 0 ? kcalLabel : "–"}
          </span>
        </div>
      </div>
      {showFooterLegend && sum > 0 ? (
        <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] tabular-nums text-muted-foreground md:text-[11px]">
          <li className="flex items-center gap-1">
            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: COL.protein }} aria-hidden />
            P {pct(protein, sum)}%
          </li>
          <li className="flex items-center gap-1">
            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: COL.karbs }} aria-hidden />
            K {pct(karbs, sum)}%
          </li>
          <li className="flex items-center gap-1">
            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: COL.fett }} aria-hidden />
            F {pct(fett, sum)}%
          </li>
        </ul>
      ) : null}
    </div>
  );
}
