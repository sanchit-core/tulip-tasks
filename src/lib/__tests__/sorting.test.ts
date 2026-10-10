import { describe, expect, it } from "vitest";
import { mkWorkspace } from "./helpers";
import { rawBacklog, rawColumnTasks, siblings, task } from "$lib/selectors";
import {
  addSubtask,
  addTag,
  addTask,
  addBoard,
  addColumn,
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
  renameBoard,
  renameColumn,
  renameSubtask,
  reopenTask,
  setWipLimit,
  toggleColumnDone,
  toggleSubtask,
  updateSettings,
  updateTask,
} from "$lib/mutations";
import { emptyWorkspace } from "$lib/workspace";
import { PRIORITY_RANK, byOrderThenCreated, byPriority, clamp } from "$lib/sorting";
import { emptyFilters, filterActive, matchesTask, visibleToRawIndex } from "$lib/filters";
import { uid } from "$lib/ids";
import { addDays, todayISO } from "$lib/dates";
import { allTags, backlogTasks, boards, columnTasks, dueOn, overdueTasks, stats } from "$lib/selectors";

describe("sorting", () => {
  it("clamp bounds the value", () => {
    expect(clamp(10, 0, 3)).toBe(3);
    expect(clamp(-5, 0, 3)).toBe(0);
    expect(clamp(1, 0, 3)).toBe(1);
  });
  it("byPriority uses PRIORITY_RANK", () => {
    const ws = mkWorkspace();
    const hi = addTask(ws, "b1", { title: "hi", columnId: "c1", priority: "high" });
    const lo = addTask(ws, "b1", { title: "lo", columnId: "c1", priority: "low" });
    expect(PRIORITY_RANK.low).toBeGreaterThan(PRIORITY_RANK.high);
    const list = [lo, hi].sort(byPriority);
    expect(list[0].id).toBe(hi.id);
  });
  it("byOrderThenCreated is stable when orders equal", () => {
    const ws = mkWorkspace();
    const t1 = addTask(ws, "b1", { title: "t1", columnId: "c1" });
    const t2 = addTask(ws, "b1", { title: "t2", columnId: "c1" });
    t1.order = 0; t2.order = 0;
    const list = [t2, t1].sort(byOrderThenCreated);
    expect(list[0].createdAt <= list[1].createdAt).toBe(true);
  });
});