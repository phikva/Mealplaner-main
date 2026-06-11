"use client";

import { toast } from "sonner";

/** Én oppskrift kopiert til flere dager – `added` = antall nye rader (dager). */
export function notifyMealEntryCopyResult(added: number, skipped: number, skippedOutOfRange = 0) {
  if (added === 0 && skipped === 0 && skippedOutOfRange === 0) {
    toast.info("Ingen datoer å kopiere til.");
    return;
  }
  if (added === 0 && skippedOutOfRange > 0 && skipped === 0) {
    toast.info("Valgte datoer er utenfor det abonnementet ditt tillater.");
    return;
  }
  if (added === 0 && skipped > 0) {
    toast.info(
      skippedOutOfRange > 0
        ? "Ingen nye måltid ble lagt til – noen datoer er utenfor abonnementet eller allerede planlagt."
        : "Ingen nye måltid ble lagt til – de er allerede planlagt i de valgte dagene (samme spor).",
    );
    return;
  }
  if (skipped === 0) {
    toast.success(
      added === 1
        ? "Måltidet er kopiert til én dag til."
        : `Måltidet er kopiert til ${added} dager.`,
    );
    return;
  }
  const parts = [`La til måltid på ${added} dag(er)`];
  if (skipped > 0) parts.push(`hoppet over ${skipped} (allerede planlagt)`);
  if (skippedOutOfRange > 0) parts.push(`${skippedOutOfRange} utenfor abonnementet`);
  toast.message(parts.join(", ") + ".");
}

/** Hele dag kopiert – `added` = antall nye måltidsrader totalt. */
export function notifyMealDayCopyResult(added: number, skipped: number, skippedOutOfRange = 0) {
  if (added === 0 && skipped === 0 && skippedOutOfRange === 0) {
    toast.info("Ingen datoer å kopiere til.");
    return;
  }
  if (added === 0 && skippedOutOfRange > 0 && skipped === 0) {
    toast.info("Valgte datoer er utenfor det abonnementet ditt tillater.");
    return;
  }
  if (added === 0 && skipped > 0) {
    toast.info(
      skippedOutOfRange > 0
        ? "Ingen nye måltid ble lagt til – noen datoer er utenfor abonnementet eller allerede planlagt."
        : "Ingen nye måltid ble lagt til – måltidene finnes allerede på de valgte dagene.",
    );
    return;
  }
  if (skipped === 0) {
    toast.success(
      added === 1
        ? "Ett nytt måltid er lagt til i planen."
        : `${added} nye måltider er lagt til i planen.`,
    );
    return;
  }
  const parts = [`La til ${added} måltider i planen`];
  if (skipped > 0) parts.push(`hoppet over ${skipped} (allerede planlagt)`);
  if (skippedOutOfRange > 0) parts.push(`${skippedOutOfRange} dag(er) utenfor abonnementet`);
  toast.message(parts.join(", ") + ".");
}
