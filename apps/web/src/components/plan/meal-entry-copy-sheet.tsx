"use client";

import Link from "next/link";
import { Dialog } from "radix-ui";
import { useEffect, useState, useTransition } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { copyMealPlanEntryToDatesAction, type MealPlanRow } from "@/app/actions/meal-plan";
import { notifyMealEntryCopyResult } from "@/components/plan/plan-copy-feedback";
import { nextNDaysAfter, remainingWeekDatesAfter } from "@/components/plan/meal-plan-dates";
import { cn } from "@/lib/utils";
import type { SanityRecipe } from "@/types/page";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: MealPlanRow;
  recipe?: SanityRecipe;
  onCopied: () => void;
};

export function MealEntryCopySheet({ open, onOpenChange, entry, recipe, onCopied }: Props) {
  const title = recipe?.tittel ?? "Ukjent oppskrift";
  const path = recipe?.path;
  const sourceYmd = entry.plan_date;
  const restOfWeek = remainingWeekDatesAfter(sourceYmd);
  const [forwardDays, setForwardDays] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setError(null);
      setForwardDays(3);
    }
  }, [open]);

  const runCopy = (dates: string[]) => {
    setError(null);
    startTransition(async () => {
      const res = await copyMealPlanEntryToDatesAction({
        sourceEntryId: entry.id,
        targetDates: dates,
      });
      if (!res.ok) {
        setError(res.error === "not_authenticated" ? "Logg inn på nytt." : "Kunne ikke kopiere. Prøv igjen.");
        return;
      }
      notifyMealEntryCopyResult(res.added, res.skipped);
      onOpenChange(false);
      onCopied();
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]",
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed z-50 flex max-h-[min(90dvh,620px)] w-full max-w-md flex-col border border-border/50 bg-background shadow-2xl outline-none duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "max-md:inset-x-0 max-md:bottom-0 max-md:rounded-t-3xl max-md:border-b-0 max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:slide-out-to-bottom",
            "max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))]",
            "md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:data-[state=open]:zoom-in-95 md:data-[state=closed]:zoom-out-95",
          )}
        >
          <div className="flex shrink-0 justify-center bg-gradient-to-b from-muted/35 to-background pt-2 md:rounded-t-2xl md:pt-1">
            <div className="h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/25 md:hidden" aria-hidden />
          </div>
          <div className="shrink-0 space-y-1 border-b border-border/40 px-4 pb-3 pt-1 md:px-5 md:pt-3">
            <Dialog.Title className="text-base font-semibold tracking-tight">Kopier måltid</Dialog.Title>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-5">
            <p className="font-medium text-foreground">{title}</p>
            {path ? (
              <Link
                href={`/oppskrift/${path}`}
                className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                onClick={() => onOpenChange(false)}
              >
                <ExternalLink className="size-3.5" aria-hidden />
                Se oppskrift
              </Link>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Resten av uken</p>
              <p className="text-xs text-muted-foreground">
                {restOfWeek.length > 0
                  ? `${restOfWeek.length} dag(er) etter ${sourceYmd.slice(8, 10)}.${sourceYmd.slice(5, 7)} i samme uke.`
                  : "Siste dag i uken – ingen flere dager i denne uken."}
              </p>
              <button
                type="button"
                disabled={pending || restOfWeek.length === 0}
                onClick={() => runCopy(restOfWeek)}
                className={cn(
                  "flex w-full min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border/60 bg-background px-3 text-sm font-semibold transition",
                  "hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <Copy className="size-4" aria-hidden />
                Kopier til resten av uken
              </button>
            </div>

            <div className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-3">
              <label htmlFor="copy-forward-days" className="text-xs font-semibold text-muted-foreground">
                Fremover i tid
              </label>
              <p className="text-xs text-muted-foreground">
                Antall påfølgende dager (etter denne dagen) som skal få samme måltid.
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <input
                  id="copy-forward-days"
                  type="number"
                  min={1}
                  max={30}
                  value={forwardDays}
                  onChange={(e) => setForwardDays(Number(e.target.value) || 1)}
                  className="h-11 w-20 rounded-xl border border-border/60 bg-background px-3 text-center text-base font-semibold tabular-nums shadow-sm md:text-sm"
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    runCopy(nextNDaysAfter(sourceYmd, Math.min(30, Math.max(1, Math.floor(forwardDays)))))
                  }
                  className={cn(
                    "min-h-11 flex-1 cursor-pointer rounded-xl border border-border/60 bg-secondary px-3 text-sm font-semibold text-secondary-foreground transition",
                    "hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  Kopier {Math.min(30, Math.max(1, Math.floor(forwardDays)))} dager
                </button>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-border/50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:rounded-b-2xl">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="min-h-11 w-full cursor-pointer rounded-xl border border-border/60 bg-background text-sm font-semibold hover:bg-muted/40"
            >
              Lukk
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
