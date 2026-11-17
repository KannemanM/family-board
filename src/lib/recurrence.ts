import { addDays, diffDays, isValidDate, weekdayIndex } from "@/lib/dates";

export type RecurrenceKind = "none" | "daily" | "weekly" | "monthly" | "yearly";

export const RECURRENCE_LABELS: Record<RecurrenceKind, string> = {
  none: "No se repite",
  daily: "Todos los días",
  weekly: "Cada semana",
  monthly: "Cada mes",
  yearly: "Cada año",
};

export const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
export const WEEKDAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export interface RecurrenceRule {
  date: string;
  recurrence: RecurrenceKind;
  recurrenceInterval: number;
  recurrenceWeekdays: string;
  recurrenceUntil: string | null;
}

const MAX_ITERATIONS = 1200;
const MAX_WINDOW_DAYS = 800;

export function parseWeekdays(value: string): number[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 0 && item <= 6),
    ),
  ).sort((a, b) => a - b);
}

export function serializeWeekdays(days: number[]): string {
  return Array.from(new Set(days))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b)
    .join(",");
}

function monthCandidate(
  year: number,
  monthIndex: number,
  dayOfMonth: number,
): string | null {
  const candidate = new Date(Date.UTC(year, monthIndex, dayOfMonth));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== monthIndex ||
    candidate.getUTCDate() !== dayOfMonth
  ) {
    return null;
  }
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(
    dayOfMonth,
  ).padStart(2, "0")}`;
}

/**
 * Devuelve las fechas (YYYY-MM-DD) en las que una actividad ocurre dentro de
 * la ventana pedida. Las actividades sin recurrencia devuelven su única fecha.
 */
export function expandOccurrenceDates(
  rule: RecurrenceRule,
  windowStart: string,
  windowEnd: string,
): string[] {
  if (!isValidDate(rule.date) || !isValidDate(windowStart) || !isValidDate(windowEnd)) {
    return [];
  }

  const until =
    rule.recurrenceUntil && isValidDate(rule.recurrenceUntil)
      ? rule.recurrenceUntil
      : null;

  const effectiveEnd = until && until < windowEnd ? until : windowEnd;
  const start = rule.date > windowStart ? rule.date : windowStart;

  if (start > effectiveEnd) return [];

  if (rule.recurrence === "none") {
    return rule.date >= windowStart && rule.date <= windowEnd ? [rule.date] : [];
  }

  const interval = Math.max(1, Math.floor(rule.recurrenceInterval || 1));
  const [baseYear, baseMonth, baseDay] = rule.date.split("-").map(Number);
  const baseMonthIndex = baseMonth - 1;

  const results: string[] = [];

  if (rule.recurrence === "daily") {
    const offset = diffDays(rule.date, start);
    const steps = Math.ceil(offset / interval);
    let cursor = addDays(rule.date, steps * interval);
    let guard = 0;

    while (cursor <= effectiveEnd && guard < MAX_ITERATIONS) {
      results.push(cursor);
      cursor = addDays(cursor, interval);
      guard += 1;
    }
    return results;
  }

  if (rule.recurrence === "weekly") {
    const weekdays = parseWeekdays(rule.recurrenceWeekdays);
    const daysOfWeek = weekdays.length > 0 ? weekdays : [weekdayIndex(rule.date)];

    let cursor = start;
    let guard = 0;
    let scanned = diffDays(start, effectiveEnd);

    if (scanned > MAX_WINDOW_DAYS) scanned = MAX_WINDOW_DAYS;

    for (let index = 0; index <= scanned && guard < MAX_ITERATIONS; index += 1) {
      const difference = diffDays(rule.date, cursor);
      const week = Math.floor(difference / 7);
      const allowedWeek = week % interval === 0;

      if (allowedWeek && daysOfWeek.includes(weekdayIndex(cursor))) {
        results.push(cursor);
        guard += 1;
      }

      cursor = addDays(cursor, 1);
    }

    return results;
  }

  if (rule.recurrence === "monthly") {
    for (let step = 0; step < MAX_ITERATIONS; step += 1) {
      const totalMonths = baseMonthIndex + step * interval;
      const year = baseYear + Math.floor(totalMonths / 12);
      const monthIndex = ((totalMonths % 12) + 12) % 12;
      const candidate = monthCandidate(year, monthIndex, baseDay);

      if (!candidate) continue;
      if (candidate > effectiveEnd) break;

      if (candidate >= start) results.push(candidate);
    }
    return results;
  }

  // yearly
  for (let step = 0; step < MAX_ITERATIONS; step += 1) {
    const year = baseYear + step * interval;
    const candidate = monthCandidate(year, baseMonthIndex, baseDay);

    if (!candidate) continue;
    if (candidate > effectiveEnd) break;

    if (candidate >= start) results.push(candidate);
  }

  return results;
}

export function describeRecurrence(rule: {
  recurrence: string;
  recurrenceInterval: number;
  recurrenceWeekdays: string;
  recurrenceUntil: string | null;
}): string {
  const kind = rule.recurrence as RecurrenceKind;
  if (!RECURRENCE_LABELS[kind] || kind === "none") return "";

  const interval = Math.max(1, rule.recurrenceInterval || 1);

  if (kind === "daily") {
    return interval === 1 ? "Todos los días" : `Cada ${interval} días`;
  }

  if (kind === "weekly") {
    const days = parseWeekdays(rule.recurrenceWeekdays);
    const base =
      interval === 1 ? "Cada semana" : `Cada ${interval} semanas`;
    if (days.length === 0) return base;
    return `${base} · ${days.map((day) => WEEKDAY_NAMES[day]).join(", ")}`;
  }

  if (kind === "monthly") {
    return interval === 1 ? "Cada mes" : `Cada ${interval} meses`;
  }

  return interval === 1 ? "Cada año" : `Cada ${interval} años`;
}

export function normalizeRecurrence(value: string | null | undefined): RecurrenceKind {
  if (
    value === "daily" ||
    value === "weekly" ||
    value === "monthly" ||
    value === "yearly"
  ) {
    return value;
  }
  return "none";
}
