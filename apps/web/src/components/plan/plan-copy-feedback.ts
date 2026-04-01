"use client";

import { toast } from "sonner";

/** Én oppskrift kopiert til flere dager – `added` = antall nye rader (dager). */
export function notifyMealEntryCopyResult(added: number, skipped: number) {
  if (added === 0 && skipped === 0) {
    toast.info("Ingen datoer å kopiere til.");
    return;
  }
  if (added === 0 && skipped > 0) {
    toast.info(
      "Ingen nye måltid ble lagt til – de er allerede planlagt i de valgte dagene (samme spor).",
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
  toast.message(
    `La til måltid på ${added} dag(er), hoppet over ${skipped} (allerede planlagt).`,
  );
}

/** Hele dag kopiert – `added` = antall nye måltidsrader totalt. */
export function notifyMealDayCopyResult(added: number, skipped: number) {
  if (added === 0 && skipped === 0) {
    toast.info("Ingen datoer å kopiere til.");
    return;
  }
  if (added === 0 && skipped > 0) {
    toast.info("Ingen nye måltid ble lagt til – måltidene finnes allerede på de valgte dagene.");
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
  toast.message(
    `La til ${added} måltider i planen, hoppet over ${skipped} (allerede planlagt).`,
  );
}
