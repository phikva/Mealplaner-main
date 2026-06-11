/**
 * Alle plan-datoer (plan_date, anchor, uke/måned) tolkes som kalenderdager i Europe/Oslo,
 * uavhengig av serverens systemtidssone og brukerens lokale tidssone i nettleseren.
 */
export const MEAL_PLAN_TIMEZONE = "Europe/Oslo";

export const WEEKDAY_SHORT = ["man", "tir", "ons", "tor", "fre", "lør", "søn"] as const;

function zonedParts(d: Date, timeZone: string) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const out: Record<string, number> = {};
  for (const x of p) {
    if (x.type === "year" || x.type === "month" || x.type === "day" || x.type === "hour" || x.type === "minute" || x.type === "second") {
      out[x.type] = Number(x.value);
    }
  }
  return out;
}

/**
 * Veggklokkeslett i plan-tidssonen → UTC-instant (binærsøk, håndterer sommertid).
 */
function wallInPlanTzToUtc(year: number, month1: number, day: number, hour: number, minute: number, second: number): Date {
  const tz = MEAL_PLAN_TIMEZONE;
  let lo = Date.UTC(year, month1 - 1, day - 2, 0, 0, 0);
  let hi = Date.UTC(year, month1 - 1, day + 2, 23, 59, 59);
  if (hi < lo) [lo, hi] = [hi, lo];

  for (let i = 0; i < 56; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const p = zonedParts(new Date(mid), tz);
    const cmp =
      p.year !== year
        ? p.year - year
        : p.month !== month1
          ? p.month - month1
          : p.day !== day
            ? p.day - day
            : p.hour !== hour
              ? p.hour - hour
              : p.minute !== minute
                ? p.minute - minute
                : p.second - second;
    if (cmp === 0) return new Date(mid);
    if (cmp < 0) lo = mid + 1;
    else hi = mid - 1;
  }
  return new Date(NaN);
}

/** Kalenderdag YYYY-MM-DD i plan-tidssonen. */
export function localYmd(d: Date): string {
  const { year, month, day } = zonedParts(d, MEAL_PLAN_TIMEZONE);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Mandag = 0 … søndag = 6 i plan-tidssonen. */
export function planWeekdayMon0(d: Date): number {
  const w = new Intl.DateTimeFormat("en-US", { timeZone: MEAL_PLAN_TIMEZONE, weekday: "short" }).format(d);
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return map[w] ?? 0;
}

/** Dag og måned (1–12) i plan-tidssonen (visning). */
export function planDayAndMonth1(d: Date): { day: number; month1: number } {
  const p = zonedParts(d, MEAL_PLAN_TIMEZONE);
  return { day: p.day, month1: p.month };
}

/** Månedsindeks 0–11 som i Date#getMonth(), i plan-tidssonen. */
export function planMonthIndex0(d: Date): number {
  return zonedParts(d, MEAL_PLAN_TIMEZONE).month - 1;
}

/** YYYY-MM-DD → anker (kl. 12 i Oslo) for trygg kalenderarithmetikk. */
export function parseYmd(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return new Date(NaN);
  return wallInPlanTzToUtc(Number(m[1]), Number(m[2]), Number(m[3]), 12, 0, 0);
}

export function addDays(d: Date, n: number): Date {
  const [y, mo, da] = localYmd(d).split("-").map(Number);
  const x = new Date(Date.UTC(y, mo - 1, da + n));
  return wallInPlanTzToUtc(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate(), 12, 0, 0);
}

export function mondayOfWeek(d: Date): Date {
  const wd = planWeekdayMon0(d);
  const [y, mo, da] = localYmd(d).split("-").map(Number);
  const x = new Date(Date.UTC(y, mo - 1, da - wd));
  return wallInPlanTzToUtc(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate(), 12, 0, 0);
}

export function startOfMonth(d: Date): Date {
  const [y, mo] = localYmd(d).split("-").map(Number);
  return wallInPlanTzToUtc(y, mo, 1, 12, 0, 0);
}

export function endOfMonth(d: Date): Date {
  const [y, mo] = localYmd(d).split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  return wallInPlanTzToUtc(y, mo, lastDay, 12, 0, 0);
}

export function addMonthsInPlanTz(d: Date, delta: number): Date {
  const p = zonedParts(d, MEAL_PLAN_TIMEZONE);
  let y = p.year;
  let m = p.month + delta;
  let day = p.day;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const clamped = Math.min(day, lastDay);
  return wallInPlanTzToUtc(y, m, clamped, 12, 0, 0);
}

export function buildMonthGrid(anchor: Date): Date[] {
  const first = startOfMonth(anchor);
  const lead = planWeekdayMon0(first);
  const cells: Date[] = [];
  for (let i = lead; i > 0; i--) {
    cells.push(addDays(first, -i));
  }
  const [y, mo] = localYmd(first).split("-").map(Number);
  const dim = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  for (let i = 0; i < dim; i++) {
    cells.push(addDays(first, i));
  }
  while (cells.length % 7 !== 0) {
    cells.push(addDays(cells[cells.length - 1], 1));
  }
  while (cells.length < 42) {
    cells.push(addDays(cells[cells.length - 1], 1));
  }
  return cells.slice(0, 42);
}

export function remainingWeekDatesAfter(sourceYmd: string): string[] {
  const d = parseYmd(sourceYmd);
  if (Number.isNaN(d.getTime())) return [];
  const mon = mondayOfWeek(d);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const ymd = localYmd(addDays(mon, i));
    if (ymd > sourceYmd) out.push(ymd);
  }
  return out;
}

export function nextNDaysAfter(sourceYmd: string, n: number): string[] {
  const d = parseYmd(sourceYmd);
  if (Number.isNaN(d.getTime())) return [];
  const out: string[] = [];
  for (let i = 1; i <= n; i++) {
    out.push(localYmd(addDays(d, i)));
  }
  return out;
}

/** Kalenderdager fra `fromYmd` til `toYmd` (0 = samme dag). */
export function daysBetweenYmd(fromYmd: string, toYmd: string): number {
  const from = parseYmd(fromYmd);
  const to = parseYmd(toYmd);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return Number.NaN;
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

/** Sjekker om plan_date er innenfor abonnementets planleggingsvindu (fra i dag). */
export function isPlanDateWithinStorageLimit(
  planDate: string,
  maxDays: number | null,
  todayYmd: string = localYmd(new Date()),
): boolean {
  if (maxDays == null) return true;
  const diff = daysBetweenYmd(todayYmd, planDate);
  if (Number.isNaN(diff)) return false;
  if (diff < 0) return true;
  return diff < maxDays;
}

/** Maks antall påfølgende dager (etter sourceYmd) som fortsatt er innenfor abonnementsvinduet. */
export function maxForwardCopyDaysFrom(
  sourceYmd: string,
  maxDays: number | null,
  todayYmd: string = localYmd(new Date()),
): number {
  if (maxDays == null) return 30;
  let allowed = 0;
  const source = parseYmd(sourceYmd);
  if (Number.isNaN(source.getTime())) return 0;
  for (let i = 1; i <= 30; i++) {
    const ymd = localYmd(addDays(source, i));
    if (!isPlanDateWithinStorageLimit(ymd, maxDays, todayYmd)) break;
    allowed = i;
  }
  return allowed;
}
