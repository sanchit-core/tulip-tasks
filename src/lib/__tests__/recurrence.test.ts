import { describe, expect, it } from "vitest";
import { addDays, todayISO } from "$lib/dates";
import {
  describeRecurrence,
  nextDate,
  nextOccurrenceDue,
  recurrenceBadge,
} from "$lib/recurrence";
import type { Recurrence } from "$lib/types";

describe("describeRecurrence", () => {
  it("describes the five kinds", () => {
    expect(describeRecurrence({ kind: "none", interval: 1 })).toBe("Never");
    expect(describeRecurrence({ kind: "daily", interval: 1 })).toBe("Every day");
    expect(describeRecurrence({ kind: "weekly", interval: 1 })).toBe("Every week");
    expect(describeRecurrence({ kind: "monthly", interval: 1 })).toBe("Every month");
    expect(describeRecurrence({ kind: "yearly", interval: 1 })).toBe("Every year");
    expect(describeRecurrence({ kind: "weekly", interval: 2 })).toBe("Every 2 weeks");
  });
});

describe("recurrenceBadge", () => {
  it("is null for never, short otherwise", () => {
    expect(recurrenceBadge({ kind: "none", interval: 1 })).toBeNull();
    expect(recurrenceBadge({ kind: "weekly", interval: 1 })).toBe("↻ w");
    expect(recurrenceBadge({ kind: "monthly", interval: 2 })).toBe("↻ 2mo");
    expect(recurrenceBadge({ kind: "yearly", interval: 1 })).toBe("↻ y");
  });
});

describe("nextDate", () => {
  const r = (kind: Recurrence["kind"], interval = 1): Recurrence => ({ kind, interval });

  it("steps each unit", () => {
    expect(nextDate(r("daily"), "2026-10-10")).toBe("2026-10-11");
    expect(nextDate(r("weekly"), "2026-10-10")).toBe("2026-10-17");
    expect(nextDate(r("monthly"), "2026-01-31")).toBe("2026-02-28");
    expect(nextDate(r("yearly"), "2024-02-29")).toBe("2025-02-28");
  });

  it("honours the interval", () => {
    expect(nextDate(r("daily", 3), "2026-10-10")).toBe("2026-10-13");
    expect(nextDate(r("monthly", 2), "2026-01-15")).toBe("2026-03-15");
  });

  it("returns null for kind none", () => {
    expect(nextDate(r("none"), "2026-10-10")).toBeNull();
  });
});

describe("nextOccurrenceDue", () => {
  it("returns today (or later) even after a long lapse", () => {
    const today = todayISO();
    const due = nextOccurrenceDue({ kind: "daily", interval: 1 }, addDays(today, -30));
    expect(due >= today).toBe(true);
    expect(Number.isNaN(new Date(due).getTime())).toBe(false);
  });

  it("moves a weekly task forward to the expected weekday", () => {
    const today = todayISO();
    // Last instance yesterday => next lands today.
    const due = nextOccurrenceDue({ kind: "weekly", interval: 1 }, addDays(today, -7));
    expect(due).toBe(today);
  });
});