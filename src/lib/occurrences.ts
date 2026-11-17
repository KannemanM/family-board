import { addDays, zonedToUtcMs } from "@/lib/dates";
import type { OccurrenceDTO } from "@/lib/types";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export function occurrenceStartMs(
  occurrence: Pick<OccurrenceDTO, "date" | "startTime" | "allDay">,
  timezone: string,
): number {
  if (occurrence.allDay || !occurrence.startTime) {
    return zonedToUtcMs(occurrence.date, "00:00", timezone);
  }
  return zonedToUtcMs(occurrence.date, occurrence.startTime, timezone);
}

export function occurrenceEndMs(
  occurrence: Pick<
    OccurrenceDTO,
    "date" | "startTime" | "endTime" | "allDay"
  >,
  timezone: string,
): number {
  if (occurrence.allDay || !occurrence.startTime) {
    return zonedToUtcMs(addDays(occurrence.date, 1), "00:00", timezone) - 1;
  }

  const start = occurrenceStartMs(occurrence, timezone);

  if (occurrence.endTime) {
    const end = zonedToUtcMs(occurrence.date, occurrence.endTime, timezone);
    return end > start ? end : start + HOUR_MS;
  }

  return start + 2 * HOUR_MS;
}

export function reminderOffsetMs(reminder: OccurrenceDTO["reminder"]): number {
  if (!reminder) return 0;
  return reminder.unit === "days"
    ? reminder.value * DAY_MS
    : reminder.value * HOUR_MS;
}

export function isOccurrenceHighlighted(
  occurrence: OccurrenceDTO,
  nowMs: number,
  timezone: string,
): boolean {
  if (occurrence.state !== "active") return false;

  const start = occurrenceStartMs(occurrence, timezone);
  const end = occurrenceEndMs(occurrence, timezone);

  if (occurrence.reminder) {
    const remindAt = start - reminderOffsetMs(occurrence.reminder);
    if (nowMs >= remindAt && nowMs <= Math.max(end, start + HOUR_MS)) {
      return true;
    }
  }

  if (occurrence.priority === "urgent") {
    const daysAhead = (start - nowMs) / DAY_MS;
    return daysAhead <= 7 && nowMs <= end + DAY_MS;
  }

  return false;
}
