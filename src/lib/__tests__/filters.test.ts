import { describe, expect, it } from "vitest";
import { addDays, todayISO } from "$lib/dates";
import { emptyFilters, filterActive, matchesTask, visibleToRawIndex, type Filters } from "$lib/filters";
import { mkTask } from "./helpers";

describe("emptyFilters", () => {
  it("creates fully independent filter objects", () => {
    const a = emptyFilters();
    const b = emptyFilters();
    expect(a.tags).not.toBe(b.tags);
    expect(a.priorities).not.toBe(b.priorities);
    a.tags.push("x");
    expect(b.tags).toHaveLength(0);
  });
});

describe("filterActive", () => {
  it("detects any active dimension", () => {
    expect(filterActive(emptyFilters())).toBe(false);
    expect(filterActive({ ...emptyFilters(), tags: ["x"] })).toBe(true);
    expect(filterActive({ ...emptyFilters(), priorities: ["high"] })).toBe(true);
    expect(filterActive({ ...emptyFilters(), due: "overdue" })).toBe(true);
    expect(filterActive({ ...emptyFilters(), query: "  find me  " })).toBe(true);
  });
});

describe("matchesTask", () => {
  const today = "2026-10-10";
  const f = () => emptyFilters();

  it("matches free text across title, notes and tags", () => {
    const t = mkTask({ title: "Fix Checkout", notes: "storage engine", tags: ["bug", "ui"] });
    expect(matchesTask(t, f(), today)).toBe(true);
    expect(matchesTask(t, { ...f(), query: "checkout" }, today)).toBe(true);
    expect(matchesTask(t, { ...f(), query: "storage" }, today)).toBe(true);
    expect(matchesTask(t, { ...f(), query: "ui" }, today)).toBe(true);
    expect(matchesTask(t, { ...f(), query: "missing" }, today)).toBe(false);
  });

  it("requires every selected tag", () => {
    const t = mkTask({ tags: ["a", "b"] });
    expect(matchesTask(t, { ...f(), tags: ["a"] }, today)).toBe(true);
    expect(matchesTask(t, { ...f(), tags: ["a", "b"] }, today)).toBe(true);
    expect(matchesTask(t, { ...f(), tags: ["a", "c"] }, today)).toBe(false);
  });

  it("filters by priority set", () => {
    const t = mkTask({ priority: "high" });
    expect(matchesTask(t, { ...f(), priorities: ["high"] }, today)).toBe(true);
    expect(matchesTask(t, { ...f(), priorities: ["urgent", "high"] }, today)).toBe(true);
    expect(matchesTask(t, { ...f(), priorities: ["urgent"] }, today)).toBe(false);
  });

  it("filters by due window", () => {
    const overdue = mkTask({ due: addDays(today, -1), completedAt: null });
    const doneOverdue = mkTask({ due: addDays(today, -1), completedAt: today });
    const todays = mkTask({ due: today });
    const none = mkTask({ due: null });
    const soon = mkTask({ due: addDays(today, 3) });
    const far = mkTask({ due: addDays(today, 30) });

    expect(matchesTask(overdue, { ...f(), due: "overdue" }, today)).toBe(true);
    expect(matchesTask(doneOverdue, { ...f(), due: "overdue" }, today)).toBe(false);
    expect(matchesTask(overdue, { ...f(), due: "today" }, today)).toBe(false);
    expect(matchesTask(todays, { ...f(), due: "today" }, today)).toBe(true);
    expect(matchesTask(none, { ...f(), due: "none" }, today)).toBe(true);
    expect(matchesTask(todays, { ...f(), due: "none" }, today)).toBe(false);
    for (const t of [todays, soon]) {
      expect(matchesTask(t, { ...f(), due: "week" }, today)).toBe(true);
    }
    expect(matchesTask(far, { ...f(), due: "week" }, today)).toBe(false);
    expect(matchesTask(far, { ...f(), due: "any" }, today)).toBe(true);
  });

  it("hides completed tasks when asked", () => {
    const done = mkTask({ completedAt: today });
    const open = mkTask({ completedAt: null });
    expect(matchesTask(done, f(), today)).toBe(false);
    expect(matchesTask(done, { ...f(), hideCompleted: false }, today)).toBe(true);
    expect(matchesTask(open, f(), today)).toBe(true);
  });
});

describe("visibleToRawIndex", () => {
  const filter: Filters = { query: "", tags: ["keep"], priorities: [], due: "any", hideCompleted: false };
  // i=1:no, i=2:keep, i=3:no, i=4:keep  ->  raw = [1, 2, 4, 3]
  const t1 = mkTask({ title: "t1", tags: [], order: 1 });
  const t2 = mkTask({ title: "t2", tags: ["keep"], order: 2 });
  const t3 = mkTask({ title: "t3", tags: [], order: 3 });
  const t4 = mkTask({ title: "t4", tags: ["keep"], order: 4 });
  const raw = [t1, t2, t4, t3];

  it("maps a filtered slot to its raw position", () => {
    // visible = [t2 (idx 1), t4 (idx 2)]
    expect(visibleToRawIndex(raw, filter, 0)).toBe(1);
    expect(visibleToRawIndex(raw, filter, 1)).toBe(2);
  });

  it("appends when the visible index is out of range", () => {
    expect(visibleToRawIndex(raw, filter, 2)).toBe(raw.length);
  });
});