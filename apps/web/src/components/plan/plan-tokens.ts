import { cn } from "@/lib/utils";

/**
 * Delte flater for måltidsplanleggeren.
 * Ukevisning: én kolonne + dagchips under `md`, 7 kolonner fra `md`.
 * Dialoger (legg til / kopier): bottom sheet under `md`, sentrert modal fra `md`.
 *
 * Radius-skala (planlegger):
 * - Primærflate: rounded-3xl (sammendrag, dagvisning-seksjon)
 * - Sekundærflate: rounded-2xl / rounded-xl (uke-dagkort, måltidskort, paneler i sammendrag)
 * - Kontroller i dialog: rounded-xl (inputs, plan-spesifikke knapper via className)
 */

/** Profil-lignende hovedflate for planlegger-kort */
export const planSurfaceCard = "rounded-3xl border border-border/60 bg-background/85 shadow-sm";

/** Nivå 2 panel i periodesammendrag (tekstblokk / diagram+legend). */
export const planSummaryPanel =
  "rounded-2xl border border-border/40 bg-muted/15 p-3 md:p-4 dark:border-border/50 dark:bg-muted/10";

/** Ukedag-rad / kolonne-header – skiller seg fra måltidskort (inset) uten primary */
export const planDayHeader =
  "border border-border/55 bg-accent/[0.08] shadow-sm ring-1 ring-border/30 dark:bg-accent/[0.06] dark:ring-border/35";

/** Inndre kort / måltidskort */
export const planInsetCard = "rounded-xl border border-border/50 bg-card/60 shadow-sm";

/** Ukekolonne / dagpanel – tom dag */
export const planDayEmpty = "border-border/50 bg-background/90";

/** Dag med innhold – aksent (grønnlig), ikke primary/rød */
export const planDayHasMeals = "border-border/70 ring-1 ring-border/35";

/** Månedscelle med måltider */
export const planMonthCellHasMeals = "border-border/55 bg-accent/[0.1] ring-1 ring-border/30";

/** Månedscelle uten måltider (i måneden) */
export const planMonthCellEmpty = "border-border/45 bg-background/90";

/** Kompakt «legg til»-knapp i månedsrute (ikke primary-tekst) */
export const planCompactAdd = "text-accent-foreground/90";

/**
 * «Sum for dagen» / kolonnesum – sekundærfarget (lilla i theme), skiller seg fra blåaktig muted.
 */
export const planSumBox =
  "border-secondary/35 bg-secondary/[0.13] dark:border-secondary/30 dark:bg-secondary/[0.12]";

/** Ett avrundet kort som omslutter dag-header + sum/knapper (mobil og desktop uke). */
export const planWeekDayMergedCard =
  "overflow-hidden rounded-2xl border border-border/55 bg-background/90 shadow-sm ring-1 ring-border/30 dark:bg-background/85 dark:ring-border/35";

/** Øvre stripe i `planWeekDayMergedCard` (ukedag + dato). */
export const planWeekDayMergedCardHeader =
  "bg-accent/[0.08] px-2 py-2 dark:bg-accent/[0.06]";

/** Nedre del: sum + makro + knapper (bakgrunn som planSumBox, uten egen ytre ramme). */
export const planWeekDayMergedCardBody =
  "bg-secondary/[0.13] p-2 dark:bg-secondary/[0.12]";

/** `card` = ramme rundt hele dagkolonnen (reservert / eldre). `open` = ingen ytterramme; brukes for uke (mobil + desktop 7-kol) slik at kun `planWeekDayMergedCard` har border. */
export function planDayColumnClass(hasMeals: boolean, layout: "card" | "open" = "card"): string {
  if (layout === "open") {
    return cn("flex min-h-[14rem] flex-col rounded-xl p-1.5 md:min-h-[16rem]", hasMeals && "bg-accent/[0.04]");
  }
  return cn(
    "flex min-h-[14rem] flex-col rounded-xl border p-2 shadow-sm md:min-h-[16rem]",
    hasMeals ? planDayHasMeals : planDayEmpty,
  );
}
