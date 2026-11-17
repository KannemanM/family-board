import { describe, expect, it } from "vitest";

import {
  expandOccurrenceDates,
  parseWeekdays,
  serializeWeekdays,
  type RecurrenceRule,
} from "@/lib/recurrence";

function rule(partial: Partial<RecurrenceRule>): RecurrenceRule {
  return {
    date: "2026-11-17",
    recurrence: "none",
    recurrenceInterval: 1,
    recurrenceWeekdays: "",
    recurrenceUntil: null,
    ...partial,
  };
}

describe("recurrence expansion", () => {
  it("returns a single date for non-recurring activities", () => {
    expect(
      expandOccurrenceDates(
        rule({ date: "2026-11-17" }),
        "2026-11-17",
        "2026-11-23",
      ),
    ).toEqual(["2026-11-17"]);

    expect(
      expandOccurrenceDates(
        rule({ date: "2026-11-10" }),
        "2026-11-17",
        "2026-11-23",
      ),
    ).toEqual([]);
  });

  it("expands daily recurrences inside the window", () => {
    expect(
      expandOccurrenceDates(
        rule({ date: "2026-11-17", recurrence: "daily" }),
        "2026-11-17",
        "2026-11-20",
      ),
    ).toEqual(["2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"]);
  });

  it("respects daily intervals and window offsets", () => {
    expect(
      expandOccurrenceDates(
        rule({
          date: "2026-11-16",
          recurrence: "daily",
          recurrenceInterval: 2,
        }),
        "2026-11-17",
        "2026-11-22",
      ),
    ).toEqual(["2026-11-18", "2026-11-20", "2026-11-22"]);
  });

  it("defaults weekly recurrences to the start weekday", () => {
    expect(
      expandOccurrenceDates(
        rule({ date: "2026-11-17", recurrence: "weekly" }),
        "2026-11-17",
        "2026-12-01",
      ),
    ).toEqual(["2026-11-17", "2026-11-24", "2026-12-01"]);
  });

  it("supports multiple weekdays", () => {
    expect(
      expandOccurrenceDates(
        rule({
          date: "2026-11-16",
          recurrence: "weekly",
          recurrenceWeekdays: "0,2,4",
        }),
        "2026-11-16",
        "2026-11-22",
      ),
    ).toEqual(["2026-11-16", "2026-11-18", "2026-11-20"]);
  });

  it("supports biweekly recurrences", () => {
    expect(
      expandOccurrenceDates(
        rule({
          date: "2026-11-16",
          recurrence: "weekly",
          recurrenceInterval: 2,
          recurrenceWeekdays: "0",
        }),
        "2026-11-16",
        "2026-12-31",
      ),
    ).toEqual(["2026-11-16", "2026-11-30", "2026-12-14", "2026-12-28"]);
  });

  it("stops at the recurrence end date", () => {
    expect(
      expandOccurrenceDates(
        rule({
          date: "2026-11-17",
          recurrence: "daily",
          recurrenceUntil: "2026-11-19",
        }),
        "2026-11-17",
        "2026-11-30",
      ),
    ).toEqual(["2026-11-17", "2026-11-18", "2026-11-19"]);
  });

  it("skips months that do not have the anchor day", () => {
    expect(
      expandOccurrenceDates(
        rule({ date: "2026-01-31", recurrence: "monthly" }),
        "2026-01-01",
        "2026-06-30",
      ),
    ).toEqual(["2026-01-31", "2026-03-31", "2026-05-31"]);
  });

  it("handles monthly intervals", () => {
    expect(
      expandOccurrenceDates(
        rule({
          date: "2026-01-15",
          recurrence: "monthly",
          recurrenceInterval: 2,
        }),
        "2026-01-01",
        "2026-06-30",
      ),
    ).toEqual(["2026-01-15", "2026-03-15", "2026-05-15"]);
  });

  it("skips february 29 on non-leap years", () => {
    expect(
      expandOccurrenceDates(
        rule({ date: "2024-02-29", recurrence: "yearly" }),
        "2024-01-01",
        "2028-12-31",
      ),
    ).toEqual(["2024-02-29", "2028-02-29"]);
  });

  it("clips long-running recurrences to the requested window", () => {
    const dates = expandOccurrenceDates(
      rule({ date: "2020-01-01", recurrence: "daily" }),
      "2026-11-17",
      "2026-11-19",
    );
    expect(dates).toEqual(["2026-11-17", "2026-11-18", "2026-11-19"]);
  });

  it("parses and serializes weekdays", () => {
    expect(parseWeekdays("")).toEqual([]);
    expect(parseWeekdays("4,0,2,2")).toEqual([0, 2, 4]);
    expect(serializeWeekdays([4, 0, 2])).toBe("0,2,4");
    expect(parseWeekdays("9,x,3")).toEqual([3]);
  });
});
