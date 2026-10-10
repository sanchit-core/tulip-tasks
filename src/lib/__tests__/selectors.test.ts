import { describe, expect, it } from "vitest";
import { addDays, todayISO } from "$lib/dates";
import { emptyFilters } from "$lib/filters";
import {
  allTags,
  backlogTasks,
  boards,
  columnTasks,
  dueOn,
  overdueTasks,
  rawBacklog,
  rawColumnTasks,
  siblings,
  stats,
  task,
  visibleTasks,
} from "$lib/selectors";
import { mkTask, mkWorkspace } from "./helpers";

const f = emptyFilters();

describe("lookups", () => {
  it("boards are sorted by order (stable for ties)", () => {
    const ws = mkWorkspace();
    const b2 = { ...ws.boards[0], id: "b2", order: 2 };
    const b0 = { ...ws.boards[0], id: "b0", order: 0 };
    ws.boards.push(b2);
    ws.boards.push(b0);
    // Stable sort keeps original b1 before b0 when order=0.
    expect(boards(ws).map((b) => b.id)).toEqual(["b1", "b0", "b2"]);
  });

  it("tasks and columns are found by id/board", () => {
    const ws = mkWorkspace();
    const t = mkTask({ boardId: "b1", columnId: "c1" });
    ws.tasks.push(t);
    expect(task(ws, t.id)?.title).toBe(t.title);
    expect(task(ws, "missing")).toBeNull();
    expect(rawColumnTasks(ws, "c1").map((x) => x.id)).toEqual([t.id]);
  });
});

describe("backlog handling is per-board", () => {
  it("rawBacklog and backlogTasks keep boards apart", () => {
    const ws = mkWorkspace();
    const a = mkTask({ id: "a", boardId: "b1", columnId: null, title: "a" });
    const b = mkTask({ id: "b", boardId: "other", columnId: null, title: "b" });
    ws.tasks.push(a, b);
    expect(rawBacklog(ws, "b1").map((x) => x.id)).toEqual(["a"]);
    expect(backlogTasks(ws, "other", f).map((x) => x.id)).toEqual(["b"]);
  });

  it("siblings of a null column only include same-board backlog", () => {
    const ws = mkWorkspace();
    const a = mkTask({ id: "a", boardId: "b1", columnId: null });
    const b = mkTask({ id: "b", boardId: "other", columnId: null });
    ws.tasks.push(a, b);
    expect(siblings(ws, null, "b1").map((x) => x.id)).toEqual(["a"]);
  });
});

describe("filtering", () => {
  it("columnTasks applies the query", () => {
    const ws = mkWorkspace();
    const t = mkTask({ boardId: "b1", columnId: "c1", title: "Checkout flow" });
    ws.tasks.push(t);
    expect(columnTasks(ws, "c1", f).length).toBe(1);
    expect(columnTasks(ws, "c1", { ...f, query: "unrelated" })).toHaveLength(0);
  });

  it("visibleTasks scopes to a board or everything", () => {
    const ws = mkWorkspace();
    const a = mkTask({ id: "a", boardId: "b1", columnId: "c1" });
    const b = mkTask({ id: "b", boardId: "other", columnId: "c1" });
    ws.tasks.push(a, b);
    expect(visibleTasks(ws, "b1", f).map((x) => x.id)).toEqual(["a"]);
    expect(visibleTasks(ws, null, f).map((x) => x.id).sort()).toEqual(["a", "b"]);
  });

  it("allTags is a deduped sorted list", () => {
    const ws = mkWorkspace();
    ws.tasks.push(mkTask({ tags: ["beta", "alpha"] }), mkTask({ tags: ["beta", "gamma"] }));
    expect(allTags(ws)).toEqual(["alpha", "beta", "gamma"]);
  });
});

describe("due helpers", () => {
  const today = todayISO();

  it("dueOn collects that exact day only and skips completed tasks", () => {
    const ws = mkWorkspace();
    const t1 = mkTask({ boardId: "b1", due: today, priority: "urgent" });
    const t2 = mkTask({ boardId: "b1", due: today, priority: "medium" });
    const t3 = mkTask({ boardId: "b1", due: addDays(today, 1), priority: "urgent" });
    const t4 = mkTask({ boardId: "b1", due: today, priority: "low", completedAt: today });
    ws.tasks.push(t1, t2, t3, t4);
    expect(dueOn(ws, today, "b1", f).map((x) => x.id)).toEqual([t1.id, t2.id]);
  });

  it("overdueTasks lists only past, unfinished, in the right window", () => {
    const ws = mkWorkspace();
    const old = mkTask({ id: "old", boardId: "b1", due: addDays(today, -2) });
    const yesterday = mkTask({ id: "y", boardId: "b1", due: addDays(today, -1) });
    const done = mkTask({ id: "d", boardId: "b1", due: addDays(today, -1), completedAt: today });
    const now = mkTask({ id: "n", boardId: "b1", due: today });
    const other = mkTask({ id: "o", boardId: "other", due: addDays(today, -1) });
    ws.tasks.push(old, yesterday, done, now, other);
    expect(overdueTasks(ws, "b1", f).map((x) => x.id)).toEqual(["old", "y"]);
  });

  it("stats counts exactly what the sidebar shows", () => {
    const ws = mkWorkspace();
    const done = mkTask({
      boardId: "b1",
      due: addDays(today, -1),
      columnId: "done",
      completedAt: today,
      subtasks: [
        { id: "s1", title: "a", done: true },
        { id: "s2", title: "b", done: false },
      ],
    });
    const open = mkTask({ boardId: "b1", columnId: "c1", due: today });
    ws.tasks.push(done, open);
    // Only open tasks contribute to subtask counts.
    expect(stats(ws, "b1")).toEqual({
      total: 2,
      open: 1,
      done: 1,
      backlog: 0,
      overdue: 0,
      dueToday: 1,
      completedSubtasks: 0,
      subtasks: 0,
    });
  });
});