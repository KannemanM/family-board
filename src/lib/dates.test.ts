import { describe, expect, it } from "vitest";

import {
  addDays,
  diffDays,
  formatDateLong,
  formatWeekdayShort,
  todayInTimeZone,
  weekdayIndex,
  zonedToUtcMs,
} from "@/lib/dates";

const BA = "America/Argentina/Buenos_Aires";

describe("date helpers", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
  });

  it("computes differences in calendar days", () => {
    expect(diffDays("2026-11-17", "2026-11-20")).toBe(3);
    expect(diffDays("2026-11-20", "2026-11-17")).toBe(-3);
    expect(diffDays("2026-12-31", "2027-01-01")).toBe(1);
  });

  it("uses monday as the first weekday index", () => {
    expect(weekdayIndex("2026-11-16")).toBe(0);
    expect(weekdayIndex("2026-11-17")).toBe(1);
    expect(weekdayIndex("2026-11-22")).toBe(6);
  });

  it("resolves today in the configured timezone", () => {
    const lateNightUtc = new Date("2026-11-18T01:00:00.000Z");
    expect(todayInTimeZone(BA, lateNightUtc)).toBe("2026-11-17");
    expect(todayInTimeZone("Europe/Madrid", lateNightUtc)).toBe("2026-11-18");
  });

  it("converts zoned local times to UTC", () => {
    expect(zonedToUtcMs("2026-11-17", "15:30", BA)).toBe(
      Date.UTC(2026, 10, 17, 18, 30),
    );
    expect(zonedToUtcMs("2026-11-17", "00:00", BA)).toBe(
      Date.UTC(2026, 10, 17, 3, 0),
    );
  });

  it("formats long dates in Spanish without a comma", () => {
    expect(formatDateLong("2026-11-17")).toBe("Martes 17 de noviembre");
  });

  it("formats short weekday", () => {
    expect(formatWeekdayShort("2026-11-16")).toBe("LUN");
    expect(formatWeekdayShort("2026-11-17")).toBe("MAR");
    expect(formatWeekdayShort("2026-11-18")).toBe("MIE");
    expect(formatWeekdayShort("2026-11-22")).toBe("DOM");
  });
});