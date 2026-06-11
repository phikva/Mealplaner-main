"use client";

import Image from "next/image";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { MealPlanRow } from "@/app/actions/meal-plan";
import { MealEntryCopySheet } from "@/components/plan/meal-entry-copy-sheet";
import { planInsetCard } from "@/components/plan/plan-tokens";
import { RecipeNutritionLine } from "@/components/plan/plan-nutrition";
import { recipeNutritionPerPortion } from "@/lib/meal-plan-macros";
import { recipeThumbUrl } from "@/lib/sanity/recipe-thumb";
import { cn } from "@/lib/utils";
import type { SanityRecipe } from "@/types/page";

type Props = {
  entry: MealPlanRow;
  /** Visningsnr. for dagen (1, 2, 3 …) etter sortert rekkefølge – ikke rå `sort_order` fra DB. */
  mealDisplayIndex: number;
  recipe?: SanityRecipe;
  mealStorageMaxDays: number | null;
  onRemove: () => void;
  onCopied: () => void;
  compactThumb?: boolean;
  /** Dagvisning: på md+ horisontalt kort med mindre miniatyr og større tekst (kun sammen med `compactThumb`). */
  dayListLayout?: boolean;
};

export function MealEntryCard({
  entry,
  mealDisplayIndex,
  recipe,
  mealStorageMaxDays,
  onRemove,
  onCopied,
  compactThumb,
  dayListLayout,
}: Props) {
  const [copyOpen, setCopyOpen] = useState(false);
  const title = recipe?.tittel ?? "Ukjent oppskrift";
  const mealNumber = mealDisplayIndex;
  const mealLabel = `Måltid ${mealNumber}`;
  const thumbSrc = recipe ? recipeThumbUrl(recipe.image) : null;
  const nutrition = recipe ? recipeNutritionPerPortion(recipe) : null;

  const openCopy = () => setCopyOpen(true);
  const isDayList = Boolean(compactThumb && dayListLayout);

  const textBlock = (
    <div
      className={cn(
        "min-w-0",
        compactThumb ? "space-y-0 py-0" : "space-y-0.5 py-0.5",
        !compactThumb && "flex-1",
        isDayList && "space-y-1 md:space-y-1.5",
      )}
    >
      <span
        className={cn(
          "line-clamp-2 block min-w-0 font-semibold",
          isDayList && "text-[13px] leading-snug md:text-base md:leading-snug",
          compactThumb && !isDayList && "text-[13px] leading-snug",
          !compactThumb && "text-sm leading-tight md:text-sm",
        )}
      >
        {title}
      </span>
      {!compactThumb ? (
        <>
          <span className="inline-flex shrink-0 items-center rounded-full border border-border/55 bg-muted/25 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {mealLabel}
          </span>
          <p className="text-[10px] text-muted-foreground/80">Trykk på kortet for å kopiere til flere dager.</p>
        </>
      ) : null}
      <RecipeNutritionLine
        totalKcal={nutrition?.totalKcal}
        totalMakros={nutrition?.totalMakros}
        size={isDayList ? "sm" : compactThumb ? "xs" : "md"}
        className={cn("!justify-start", compactThumb && !isDayList ? "mt-0" : "mt-1")}
      />
    </div>
  );

  const imageColumn = (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "relative shrink-0 cursor-pointer bg-muted/40 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
        compactThumb && isDayList &&
          "w-full overflow-hidden rounded-t-xl md:w-[min(11rem,34%)] md:max-w-[11rem] md:shrink-0 md:rounded-none md:rounded-l-xl",
        compactThumb && !isDayList && "w-full overflow-hidden rounded-t-xl",
        !compactThumb &&
          "h-11 w-14 overflow-hidden rounded-lg ring-1 ring-border/30 md:h-7 md:w-9 md:rounded-md",
      )}
      onClick={openCopy}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openCopy();
        }
      }}
      aria-label={`${mealLabel}: ${title}. Åpne meny for kopiering.`}
    >
      {!compactThumb ? (
        thumbSrc ? (
          <Image
            src={thumbSrc}
            alt=""
            width={56}
            height={44}
            className="size-full object-cover"
            sizes="(min-width:768px) 36px, 56px"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[9px] text-muted-foreground">⋯</div>
        )
      ) : (
        <>
          <div
            className={cn(
              "relative w-full",
              isDayList
                ? "aspect-[5/3] md:aspect-auto md:h-full md:min-h-[6.75rem] lg:min-h-[7.25rem]"
                : "aspect-[5/3] md:aspect-[4/3]",
            )}
          >
            {thumbSrc ? (
              <Image
                src={thumbSrc}
                alt=""
                fill
                className="object-cover"
                sizes={
                  isDayList
                    ? "(max-width:767px) 92vw, 176px"
                    : "(min-width:768px) 11vw, 96vw"
                }
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 text-xs text-muted-foreground">
                ⋯
              </div>
            )}
          </div>
          <span
            className={cn(
              "absolute left-1 top-1 z-10 max-w-[calc(100%-2.75rem)] rounded-lg border border-border/55 bg-background/92 px-1.5 py-0.5 text-left font-semibold leading-tight text-foreground shadow-sm backdrop-blur-sm",
              isDayList ? "text-[10px] md:text-xs" : "text-[9px] sm:text-[10px]",
            )}
            title={mealLabel}
          >
            <span className="whitespace-normal">{mealLabel}</span>
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute right-1 top-1 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-border/50 bg-background/92 text-muted-foreground shadow-md backdrop-blur-sm hover:bg-destructive/15 hover:text-destructive md:size-8"
            aria-label={`Fjern ${recipe?.tittel ?? "måltid"}`}
          >
            <Trash2 className="size-3.5" />
          </button>
        </>
      )}
    </div>
  );

  if (compactThumb) {
    return (
      <>
        <div
          className={cn(
            "flex overflow-hidden rounded-xl text-left",
            isDayList ? "flex-col md:flex-row md:items-stretch" : "flex-col",
            planInsetCard,
          )}
        >
          {imageColumn}
          <button
            type="button"
            className={cn(
              "min-w-0 w-full cursor-pointer rounded-b-xl px-2 py-1.5 text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
              isDayList &&
                "md:flex md:flex-1 md:flex-col md:justify-center md:rounded-bl-none md:rounded-r-xl md:px-4 md:py-3",
            )}
            onClick={openCopy}
          >
            {textBlock}
          </button>
        </div>
        <MealEntryCopySheet
          open={copyOpen}
          onOpenChange={setCopyOpen}
          entry={entry}
          recipe={recipe}
          mealStorageMaxDays={mealStorageMaxDays}
          onCopied={onCopied}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-row items-stretch gap-2 rounded-xl text-left md:gap-1.5 md:py-1.5",
          planInsetCard,
          "p-2",
        )}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 cursor-pointer items-stretch gap-2 rounded-xl text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring md:gap-1.5"
          onClick={openCopy}
          aria-label={`${mealLabel}: ${title}. Åpne meny for kopiering.`}
        >
          <div className="min-w-0 flex-1">{textBlock}</div>
          {imageColumn}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center self-start rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive md:size-8"
          aria-label={`Fjern ${recipe?.tittel ?? "måltid"}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <MealEntryCopySheet
        open={copyOpen}
        onOpenChange={setCopyOpen}
        entry={entry}
        recipe={recipe}
        mealStorageMaxDays={mealStorageMaxDays}
        onCopied={onCopied}
      />
    </>
  );
}
