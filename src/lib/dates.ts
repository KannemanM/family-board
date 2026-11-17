export const TIMEZONES = [
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires" },
  { value: "America/Argentina/Cordoba", label: "Córdoba" },
  { value: "America/Argentina/Mendoza", label: "Mendoza" },
  { value: "America/Argentina/Salta", label: "Salta" },
  { value: "America/Montevideo", label: "Montevideo" },
  { value: "America/Santiago", label: "Santiago" },
  { value: "America/Sao_Paulo", label: "São Paulo" },
  { value: "America/Asuncion", label: "Asunción" },
  { value: "America/La_Paz", label: "La Paz" },
  { value: "America/Lima", label: "Lima" },
  { value: "America/Bogota", label: "Bogotá" },
  { value: "America/Mexico_City", label: "Ciudad de México" },
  { value: "America/New_York", label: "Nueva York" },
  { value: "Europe/Madrid", label: "Madrid" },
] as const;

export const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";
export const DEFAULT_TIMEZONE_LABEL = "Buenos Aires";

const DAY_MS = 86_400_000;

export function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Monday-first index: 0 = lunes ... 6 = domingo */
export function weekdayIndex(date: string): number {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return (day + 6) % 7;
}

export function parseDateMs(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function msToDate(ms: number): string {
  const date = new Date(ms);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDays(date: string, amount: number): string {
  return msToDate(parseDateMs(date) + amount * DAY_MS);
}

export function diffDays(from: string, to: string): number {
  return Math.round((parseDateMs(to) - parseDateMs(from)) / DAY_MS);
}

export function todayInTimeZone(
  timezone: string,
  now: Date = new Date(),
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function timeZoneOffsetMs(timestamp: number, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(timestamp));

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );

  return asUtc - timestamp;
}

/** Convierte una fecha + hora local de la familia a un timestamp UTC. */
export function zonedToUtcMs(
  date: string,
  time: string,
  timezone: string,
): number {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);

  const firstOffset = timeZoneOffsetMs(guess, timezone);
  const firstPass = guess - firstOffset;
  const secondOffset = timeZoneOffsetMs(firstPass, timezone);

  return guess - secondOffset;
}

export function formatDateLong(date: string): string {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(new Date(`${date}T12:00:00.000Z`))
    .replace(/,\s*/, " ");

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatDateShort(date: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .format(new Date(`${date}T12:00:00.000Z`))
    .replace(/\./g, "");
}

export function formatWeekdayLong(date: string): string {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(`${date}T12:00:00.000Z`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatWeekdayShort(date: string): string {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    weekday: "short",
  })
    .format(new Date(`${date}T12:00:00.000Z`))
    .replace(/\./g, "");
  return formatted
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

export function formatDayNumber(date: string): string {
  return String(Number(date.slice(8, 10)));
}

export function formatMonthShort(date: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    month: "short",
  })
    .format(new Date(`${date}T12:00:00.000Z`))
    .replace(/\./g, "");
}

export function formatClock(timestamp: number, timezone: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(timestamp));
}

export function getClockParts(
  timestamp: number,
  timezone: string,
): { hours: string; minutes: string; seconds: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(timestamp));

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    hours: get("hour"),
    minutes: get("minute"),
    seconds: get("second"),
  };
}

export function relativeDayLabel(date: string, today: string): string {
  const days = diffDays(today, date);
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days === -1) return "Ayer";
  if (days > 1 && days <= 7) return `En ${days} días`;
  if (days < -1 && days >= -7) return `Hace ${Math.abs(days)} días`;
  return formatDateShort(date);
}
