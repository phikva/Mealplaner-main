"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ViewMode } from "@/components/plan/meal-plan-types";
import { cn } from "@/lib/utils";

type Props = {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  label: string;
  onNavigate: (dir: -1 | 1) => void;
  pending?: boolean;
};

export function MealPlanToolbar({ view, onViewChange, label, onNavigate, pending }: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="inline-flex rounded-2xl border border-border/60 bg-background/85 p-1">
        {(
          [
            ["week", "Uke"],
            ["month", "Måned"],
            ["day", "Dag"],
          ] as const
        ).map(([k, lbl]) => (
          <button
            key={k}
            type="button"
            onClick={() => onViewChange(k)}
            className={cn(
              "cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold transition",
              view === k ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {lbl}
          </button>
        ))}
      </div>
      <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
        <button
          type="button"
          onClick={() => onNavigate(-1)}
          className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-border/60 bg-background hover:bg-muted"
          aria-label="Forrige"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="min-w-0 flex-1 text-center" title={label}>
          <span className="line-clamp-2 text-xs font-semibold leading-snug text-foreground tabular-nums sm:text-sm">
            {label}
          </span>
        </span>
        <button
          type="button"
          onClick={() => onNavigate(1)}
          className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-border/60 bg-background hover:bg-muted"
          aria-label="Neste"
        >
          <ChevronRight className="size-5" />
        </button>
        {pending ? (
          <span className="text-xs text-muted-foreground" aria-live="polite">
            Oppdaterer …
          </span>
        ) : null}
      </div>
    </div>
  );
}
