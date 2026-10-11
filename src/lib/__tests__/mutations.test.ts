import { describe, expect, it } from "vitest";
import { addDays, todayISO } from "$lib/dates";
import {
  addBoard,
  addColumn,
  addSubtask,
  addTag,
  addTask,
  completeTask,
  deleteBoard,
  deleteColumn,
  deleteTask,
  duplicateTask,
  moveColumn,
  moveSubtask,
  moveTask,
  removeSubtask,
  removeTag,
  renameColumn,
  renameSubtask,
  reopenTask,
  setWipLimit,
  toggleColumnDone,
  toggleSubtask,
  updateSettings,
  updateTask,
} from "$lib/mutations";
import { rawBacklog, rawColumnTasks, siblings, task } from "$lib/selectors";
import { mkTask, mkWorkspace } from "./helpers";

describe("boards", () => {
  it("addBoard creates the default column set", () => {
    const ws = mkWorkspace();
    const b = addBoard(ws, "  My board  ");
    expect(b.title).toBe("My board");
    expect(ws.columns.filter((c) => c.boardId === b.id).map((c) => c.title)).toEqual([
      "Backlog",
      "To Do",
      "In Progress",
      "Review",
      "Done",
    ]);
  });

  it("deleteBoard removes its tasks and columns", () => {
    const ws = mkWorkspace();
    ws.tasks.push(mkTask({ id: "t1", boardId: "b1", columnId: "c1" }));
    deleteBoard(ws, "b1");
    expect(ws.boards).toHaveLength(0);
    expect(ws.columns).toHaveLength(0);
    expect(ws.tasks).toHaveLength(0);
  });
});

describe("columns", () => {
  it("addColumn appends with order, then rename/wip/done mutate in place", () => {
    const ws = mkWorkspace();
    const c = addColumn(ws, "b1", "QA")!;
    expect(c.order).toBe(2);
    renameColumn(ws, c.id, "QA2");
    const col = ws.columns.find((x) => x.id === c.id)!;
    expect(col.title).toBe("QA2");
    setWipLimit(ws, c.id, 4);
    expect(col.wipLimit).toBe(4);
    setWipLimit(ws, c.id, 0); // invalid => unlimited
    expect(col.wipLimit).toBeNull();
    toggleColumnDone(ws, c.id);
    expect(col.done).toBe(true);
  });

  it("deleteColumn orphans cards into the backlog", () => {
    const ws = mkWorkspace();
    const t = mkTask({ id: "t1", boardId: "b1", columnId: "c1" });
    ws.tasks.push(t);
    deleteColumn(ws, "c1");
    expect(ws.columns.find((c) => c.id === "c1")).toBeUndefined();
    expect(task(ws, "t1")?.columnId).toBeNull();
  });

  it("reorders the neighbor and stays in range", () => {
    const ws = mkWorkspace();
    moveColumn(ws, "c2", -1); // left
    expect(columnOrders(ws)).toEqual([1, 0]);
    moveColumn(ws, "c2", -1); // already first
    expect(columnOrders(ws)).toEqual([1, 0]);
  });
});

function columnOrders(ws: ReturnType<typeof mkWorkspace>): number[] {
  return ws.columns.map((c) => c.order);
}

describe("tasks", () => {
  it("addTask falls back to the backlog and computes order", () => {
    const ws = mkWorkspace();
    const t1 = addTask(ws, "b1", { title: "first  ", priority: "urgent" });
    const t2 = addTask(ws, "b1", { title: "second", columnId: "c1" });
    expect(t1.title).toBe("first");
    expect(t1.columnId).toBeNull();
    expect(t1.order).toBe(0);
    expect(t2.order).toBe(0);
    expect(ws.tasks).toHaveLength(2);
  });

  it("updateTask patches and bumps updatedAt", () => {
    const ws = mkWorkspace();
    const t = addTask(ws, "b1", { title: "x" });
    updateTask(ws, t.id, { notes: "hello", priority: "high" });
    expect(task(ws, t.id)?.notes).toBe("hello");
    expect(task(ws, t.id)?.priority).toBe("high");
    expect(Number.isNaN(new Date(task(ws, t.id)!.updatedAt).getTime())).toBe(false);
  });

  it("duplicateTask copies and re-homes nothing", () => {
    const ws = mkWorkspace();
    const t = addTask(ws, "b1", { title: "orig", columnId: "c1", tags: ["a"], priority: "high" });
    const copy = duplicateTask(ws, t.id)!;
    expect(copy.id).not.toBe(t.id);
    expect(copy.title).toBe("orig (copy)");
    expect(copy.columnId).toBe("c1");
    expect(copy.boardId).toBe("b1");
    expect(copy.tags).toEqual(["a"]);
  });

  it("deleteTask removes only that task", () => {
    const ws = mkWorkspace();
    const a = addTask(ws, "b1", { title: "a" });
    const b = addTask(ws, "b1", { title: "b" });
    deleteTask(ws, a.id);
    expect(ws.tasks.map((x) => x.id)).toEqual([b.id]);
  });
});

describe("moveTask", () => {
  it("reorders within the same column densely", () => {
    const ws = mkWorkspace();
    const [a, b, c] = ["a", "b", "c"].map((t) => addTask(ws, "b1", { title: t, columnId: "c1" }));
    moveTask(ws, c.id, "c1", 0);
    expect(rawColumnTasks(ws, "c1").map((x) => x.title)).toEqual(["c", "a", "b"]);
    expect(ws.tasks.find((x) => x.id === a.id)?.order).toBe(1);
  });

  it("moves between columns and into the backlog", () => {
    const ws = mkWorkspace();
    const a = addTask(ws, "b1", { title: "a", columnId: "c1" });
    addTask(ws, "b1", { title: "b", columnId: "c1" });
    moveTask(ws, a.id, "c2", 0);
    expect(task(ws, a.id)?.columnId).toBe("c2");
    expect(rawColumnTasks(ws, "c1")).toHaveLength(1);
    expect(rawColumnTasks(ws, "c2").map((x) => x.id)).toEqual([a.id]);
    moveTask(ws, a.id, null, 0);
    expect(task(ws, a.id)?.columnId).toBeNull();
    expect(rawBacklog(ws, "b1").map((x) => x.id)).toEqual([a.id]);
  });

  it("drop index is over the *target* siblings, not column-wide", () => {
    const ws = mkWorkspace();
    const other = addTask(ws, "b1", { title: "other", columnId: "c2" });
    const a = addTask(ws, "b1", { title: "a", columnId: "c1" });
    const b = addTask(ws, "b1", { title: "b", columnId: "c1" });
    moveTask(ws, a.id, "c2", 1); // after `other`
    expect(siblings(ws, "c2", "b1").map((x) => x.title)).toEqual(["other", "a"]);
    expect(siblings(ws, "c1", "b1").map((x) => x.title)).toEqual(["b"]);
  });

  it("reopenTask clears completion", () => {
    const ws = mkWorkspace();
    const a = addTask(ws, "b1", { title: "a" });
    completeTask(ws, a.id);
    expect(task(ws, a.id)?.completedAt).not.toBeNull();
    reopenTask(ws, a.id);
    expect(task(ws, a.id)?.completedAt).toBeNull();
  });
});

describe("completion with recurrence", () => {
  it("completing spawns exactly one next occurrence", () => {
    const ws = mkWorkspace();
    const today = todayISO();
    const t = addTask(ws, "b1", {
      title: "standup",
      columnId: "c1",
      due: today,
      recurrence: { kind: "daily", interval: 1 },
    });
    completeTask(ws, t.id);
    completeTask(ws, t.id); // idempotent
    const spawn = ws.tasks.find((x) => x.spawnedFrom === t.id);
    expect(spawn).toBeDefined();
    expect(spawn!.due).toBe(addDays(today, 1));
    expect(spawn!.completedAt).toBeNull();
    expect(spawn!.subtasks).toEqual([]);
    expect(ws.tasks).toHaveLength(2);
  });
});

describe("subtasks", () => {
  it("full subtask lifecycle", () => {
    const ws = mkWorkspace();
    const t = addTask(ws, "b1", { title: "parent" });
    addSubtask(ws, t.id, "  first  ");
    addSubtask(ws, t.id, "second");
    addSubtask(ws, t.id, ""); // ignored
    expect(ws.tasks[0].subtasks.map((s) => s.title)).toEqual(["first", "second"]);

    toggleSubtask(ws, t.id, ws.tasks[0].subtasks[0].id);
    expect(ws.tasks[0].subtasks[0].done).toBe(true);

    moveSubtask(ws, t.id, ws.tasks[0].subtasks[1].id, -1);
    expect(ws.tasks[0].subtasks.map((s) => s.title)).toEqual(["second", "first"]);

    renameSubtask(ws, t.id, ws.tasks[0].subtasks[0].id, "renamed");
    expect(ws.tasks[0].subtasks[0].title).toBe("renamed");

    removeSubtask(ws, t.id, ws.tasks[0].subtasks[0].id);
    expect(ws.tasks[0].subtasks).toHaveLength(1);
  });
});

describe("tags and settings", () => {
  it("addTag normalizes, reads and dedupes", () => {
    const ws = mkWorkspace();
    const t = addTask(ws, "b1", { title: "t" });
    addTag(ws, t.id, "#To-Pick?"); // -> "to-pick?"
    addTag(ws, t.id, "topick");     // different -> both kept
    addTag(ws, t.id, "");
    addTag(ws, t.id, "to-pick?");   // dedup
    expect(ws.tasks[0].tags).toEqual(["to-pick?", "topick"]);
  });

  it("removeTag removes", () => {
    const ws = mkWorkspace();
    const t = addTask(ws, "b1", { title: "t", tags: ["a", "b"] });
    const tag = ws.tasks[0].tags[0];
    removeTag(ws, t.id, tag);
    expect(ws.tasks[0].tags).toEqual(["b"]);
  });

  it("updateSettings merges", () => {
    const ws = mkWorkspace();
    updateSettings(ws, { appearance: "dark", notifyHour: 7 });
    expect(ws.settings.appearance).toBe("dark");
    expect(ws.settings.notifyHour).toBe(7);
    expect(ws.settings.notificationsEnabled).toBe(true);
  });
});