import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  addYears,
  daysInMonth,
  dueLabel,
  formatDate,
  fromISO,
  isOverdue,
  isToday,
  monthGrid,
  sameMonth,
  startOfWeek,
  toISO,
  todayISO,
  weekGrid,
} from "$lib/dates";

describe("toISO / fromISO", () => {
  it("formats local time, not UTC", () => {
    const d = new Date(2026, 9, 10); // Oct 10 2026 local
    expect(toISO(d)).toBe("2026-10-10");
  });

  it("round-trips a local date", () => {
    const d = fromISO("2026-12-31");
    expect(toISO(d!)).toBe("2026-12-31");
  });

  it("rejects overflow and garbage", () => {
    expect(fromISO("2026-02-31")).toBeNull();
    expect(fromISO("not-a-date")).toBeNull();
    expect(fromISO("2026-13-01")).toBeNull();
    expect(fromISO("2026-00-10")).toBeNull();
  });
});

describe("date arithmetic", () => {
  it("addDays crosses month boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("addMonths clamps to month length", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-01-31", 2)).toBe("2026-03-31");
  });

  it("addYears handles leap day", () => {
    expect(addYears("2024-02-29", 1)).toBe("2025-02-28");
    expect(addYears("2026-02-28", 1)).toBe("2027-02-28");
  });

  it("non-dates pass through unchanged", () => {
    expect(addDays("bogus", 3)).toBe("bogus");
    expect(addMonths("bogus", 1)).toBe("bogus");
  });

  it("daysInMonth reflects February", () => {
    expect(daysInMonth(2026, 1)).toBe(28);
    expect(daysInMonth(2028, 1)).toBe(29);
  });
});

describe("today helpers", () => {
  it("isToday matches todayISO", () => {
    const t = todayISO();
    expect(isToday(t)).toBe(true);
    expect(isToday(addDays(t, 1))).toBe(false);
  });

  it("isOverdue only for the past", () => {
    const t = todayISO();
    expect(isOverdue(addDays(t, -1))).toBe(true);
    expect(isOverdue(t)).toBe(false);
    expect(isOverdue(addDays(t, 1))).toBe(false);
  });
});

describe("grid helpers", () => {
  it("weeks start on Monday", () => {
    const d = new Date(2026, 9, 10); // a Saturday
    expect(startOfWeek(d).getDay()).toBe(1);
  });

  it("monthGrid always yields 42 cells starting on a Monday", () => {
    const grid = monthGrid(new Date(2026, 9, 1));
    expect(grid).toHaveLength(42);
    expect(grid[0].getDay()).toBe(1);
    // Oct 1 2026 is Thursday; its week starts Mon Sep 28.
    expect(sameMonth(grid[0], new Date(2026, 8, 28))).toBe(true);
  });

  it("weekGrid yields the anchor week", () => {
    const grid = weekGrid(new Date(2026, 9, 10)); // a Saturday
    expect(grid).toHaveLength(7);
    expect(toISO(grid[0])).toBe("2026-10-05"); // Monday
    expect(toISO(grid[6])).toBe("2026-10-11"); // Sunday
  });
});

describe("labelling", () => {
  it("dueLabel for today / tomorrow / past", () => {
    const t = todayISO();
    expect(dueLabel(t)).toBe("Today");
    expect(dueLabel(addDays(t, 1))).toBe("Tomorrow");
    expect(dueLabel(addDays(t, -1))).toBe("1d overdue");
    expect(dueLabel(addDays(t, -3))).toBe("3d overdue");
    expect(dueLabel(addDays(t, 4))).toBe("in 4d");
  });

  it("formatDate falls back to the raw input", () => {
    expect(formatDate("nope")).toBe("nope");
  });
});