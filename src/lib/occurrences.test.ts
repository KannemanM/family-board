import { describe, expect, it } from "vitest";

import { reminderLabel } from "@/lib/labels";
import { isOccurrenceHighlighted } from "@/lib/occurrences";
import type { OccurrenceDTO } from "@/lib/types";

const BA = "America/Argentina/Buenos_Aires";

function occurrence(
  partial: Partial<OccurrenceDTO> = {},
): OccurrenceDTO {
  return {
    id: "1:2026-11-18",
    activityId: 1,
    date: "2026-11-18",
    title: "Examen de matemática",
    notes: "",
    category: null,
    members: [],
    scope: "family",
    allDay: true,
    startTime: null,
    endTime: null,
    priority: "normal",
    recurring: false,
    reminder: { value: 1, unit: "days" },
    state: "active",
    highlighted: false,
    ...partial,
  };
}

describe("visual reminders", () => {
  it("highlights an all-day activity inside its reminder window", () => {
    const item = occurrence();
    const twoDaysBefore = Date.parse("2026-11-16T15:00:00.000Z");
    const dayBefore = Date.parse("2026-11-17T15:00:00.000Z");
    const afterItEnds = Date.parse("2026-11-19T15:00:00.000Z");

    expect(isOccurrenceHighlighted(item, twoDaysBefore, BA)).toBe(false);
    expect(isOccurrenceHighlighted(item, dayBefore, BA)).toBe(true);
    expect(isOccurrenceHighlighted(item, afterItEnds, BA)).toBe(false);
  });

  it("highlights urgent activities within the next week", () => {
    const item = occurrence({
      date: "2026-11-21",
      reminder: null,
      priority: "urgent",
    });

    expect(
      isOccurrenceHighlighted(item, Date.parse("2026-11-17T15:00:00.000Z"), BA),
    ).toBe(true);
    expect(
      isOccurrenceHighlighted(item, Date.parse("2026-11-01T15:00:00.000Z"), BA),
    ).toBe(false);
  });

  it("never highlights completed or cancelled occurrences", () => {
    const now = Date.parse("2026-11-17T15:00:00.000Z");

    expect(
      isOccurrenceHighlighted(
        occurrence({ state: "completed" }),
        now,
        BA,
      ),
    ).toBe(false);
    expect(
      isOccurrenceHighlighted(
        occurrence({ state: "cancelled" }),
        now,
        BA,
      ),
    ).toBe(false);
  });

  it("formats reminder labels for people", () => {
    expect(reminderLabel({ value: 1, unit: "hours" })).toBe("1 hora antes");
    expect(reminderLabel({ value: 3, unit: "hours" })).toBe("3 horas antes");
    expect(reminderLabel({ value: 24, unit: "hours" })).toBe("1 día antes");
    expect(reminderLabel({ value: 48, unit: "hours" })).toBe("2 días antes");
    expect(reminderLabel({ value: 1, unit: "days" })).toBe("1 día antes");
    expect(reminderLabel({ value: 7, unit: "days" })).toBe("7 días antes");
  });
});
