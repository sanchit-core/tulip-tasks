import { describe, expect, it, vi } from "vitest";
import { addDays, todayISO } from "$lib/dates";
import { store } from "$lib/store.svelte";
import type { Task } from "$lib/types";

describe("store integration", () => {
  it("boot seeds when no workspace exists and selects first board", async () => {
    localStorage.clear();
    await store.boot();
    expect(store.loaded).toBe(true);
    expect(store.boards().length).toBeGreaterThan(0);
    expect(store.activeBoardId).toBe(store.boards()[0].id);
  });

  it("addTask targets active board and persists with debounce", async () => {
    vi.useFakeTimers();
    const before = store.allTasks().length;
    const created = store.addTask({ title: "Example", priority: "high" });
    expect(created).not.toBeNull();
    expect(store.allTasks().length).toBe(before + 1);
    expect(store.saveState).toBe("saving");
    await vi.advanceTimersByTimeAsync(300);
    expect(store.saveState).toBe("idle");
    vi.useRealTimers();
  });

  it("moveTaskSmart completes on dropping into a done column", async () => {
    const board = store.activeBoard();
    if (!board) throw new Error("no board");
    const columns = store.columns(board.id);
    const doneCol = columns.find((c) => c.done);
    const todo = columns.find((c) => !c.done);
    if (!doneCol || !todo) throw new Error("missing cols");
    const t = store.addTask({ title: "auto-done", columnId: todo.id })!;
    store.moveTaskSmart(t.id, doneCol.id, 0);
    expect(store.task(t.id)?.completedAt).not.toBeNull();
  });

  it("filters drive visible tasks and toggle helpers", () => {
    const t = store.addTask({ title: "FindMeTitle" })!;
    store.filters.query = "findmetitle";
    expect(store.visibleTasks().some((x: Task) => x.id === t.id)).toBe(true);
    store.clearFilters();
    expect(store.filterActive()).toBe(false);
    store.toggleTagFilter("alpha");
    expect(store.filters.tags).toContain("alpha");
    store.toggleTagFilter("alpha");
    expect(store.filters.tags).not.toContain("alpha");
  });

  it("stats/overdue/dueOn are populated by the store", () => {
    const today = todayISO();
    const t = store.addTask({ title: "due-today", due: today })!;
    expect(store.dueOn(today).some((x: Task) => x.id === t.id)).toBe(true);
    // no overdue if due today
    expect(store.overdueTasks().every((x: Task) => x.id !== t.id)).toBe(true);
    const s = store.stats();
    expect(s.dueToday).toBeGreaterThanOrEqual(1);
  });
});