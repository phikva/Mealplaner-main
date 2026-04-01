import { Fragment, type ReactNode } from "react";
import type { MacroTotals } from "@/lib/meal-plan-macros";
import { cn } from "@/lib/utils";
import type { SanityRecipe } from "@/types/page";

const sep = <span className="select-none text-muted-foreground">·</span>;

type Size = "xs" | "sm" | "md";

const sizeClass: Record<Size, string> = {
  xs: "text-[10px] leading-snug",
  sm: "text-xs leading-snug md:text-sm",
  md: "text-sm leading-snug md:text-base",
};

function interleave(nodes: ReactNode[]): ReactNode {
  const out: ReactNode[] = [];
  nodes.forEach((n, i) => {
    if (n == null) return;
    if (out.length) out.push(<Fragment key={`s-${i}`}>{sep}</Fragment>);
    out.push(<Fragment key={i}>{n}</Fragment>);
  });
  return <>{out}</>;
}

/** Én nøytral linje: tall i foreground, separatorer muted */
export function MacroTotalsLine({
  totals,
  size = "sm",
  className,
}: {
  totals: MacroTotals;
  size?: Size;
  className?: string;
}) {
  const nodes: ReactNode[] = [];
  if (totals.kcal > 0) {
    nodes.push(
      <span key="kcal" className="font-semibold tabular-nums text-foreground">
        {`${Math.round(totals.kcal)} kcal`}
      </span>,
    );
  }
  if (totals.protein > 0) {
    nodes.push(
      <span key="p" className="font-semibold tabular-nums text-foreground">
        {`P ${Math.round(totals.protein)} g`}
      </span>,
    );
  }
  if (totals.karbs > 0) {
    nodes.push(
      <span key="k" className="font-semibold tabular-nums text-foreground">
        {`K ${Math.round(totals.karbs)} g`}
      </span>,
    );
  }
  if (totals.fett > 0) {
    nodes.push(
      <span key="f" className="font-semibold tabular-nums text-foreground">
        {`F ${Math.round(totals.fett)} g`}
      </span>,
    );
  }
  if (nodes.length === 0) {
    return <span className={cn("text-muted-foreground", sizeClass[size], className)}>Ingen næringsdata</span>;
  }
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1 gap-y-0.5", sizeClass[size], className)}>
      {interleave(nodes)}
    </span>
  );
}

export function RecipeNutritionLine({
  totalKcal,
  totalMakros,
  size = "sm",
  className,
}: {
  totalKcal?: number;
  totalMakros?: SanityRecipe["totalMakros"];
  size?: Size;
  className?: string;
}) {
  const nodes: ReactNode[] = [];
  if (typeof totalKcal === "number" && Number.isFinite(totalKcal)) {
    nodes.push(
      <span key="kcal" className="font-semibold tabular-nums text-foreground">
        {`${Math.round(totalKcal)} kcal`}
      </span>,
    );
  }
  const m = totalMakros;
  if (typeof m?.protein === "number" && Number.isFinite(m.protein)) {
    nodes.push(
      <span key="p" className="font-semibold tabular-nums text-foreground">
        {`P ${Math.round(m.protein)} g`}
      </span>,
    );
  }
  if (typeof m?.karbs === "number" && Number.isFinite(m.karbs)) {
    nodes.push(
      <span key="k" className="font-semibold tabular-nums text-foreground">
        {`K ${Math.round(m.karbs)} g`}
      </span>,
    );
  }
  if (typeof m?.fett === "number" && Number.isFinite(m.fett)) {
    nodes.push(
      <span key="f" className="font-semibold tabular-nums text-foreground">
        {`F ${Math.round(m.fett)} g`}
      </span>,
    );
  }
  if (nodes.length === 0) return null;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1 gap-y-0.5", sizeClass[size], className)}>
      {interleave(nodes)}
    </span>
  );
}
