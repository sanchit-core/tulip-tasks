import { uid } from "$lib/ids";
import type { Board, Column, Task, Workspace } from "$lib/types";
import { emptyWorkspace, nowISO } from "$lib/workspace";

let n = 0;

export function mkTask(overrides: Partial<Task> = {}): Task {
  n += 1;
  return {
    boardId: "b1",
    columnId: null,
    title: `task ${n}`,
    notes: "",
    priority: "medium",
    tags: [],
    due: null,
    order: 0,
    subtasks: [],
    recurrence: { kind: "none", interval: 1 },
    createdAt: nowISO(),
    updatedAt: nowISO(),
    completedAt: null,
    spawnedFrom: null,
    ...overrides,
    id: overrides.id ?? uid("tk"),
  };
}

interface WsOptions {
  boardId?: string;
  columnIds?: string[];
}

/** A workspace with one board + `columnIds` columns. Tasks attach to them by passing ids. */
export function mkWorkspace(options: WsOptions = {}): Workspace {
  const ws = emptyWorkspace();
  const bid = options.boardId ?? "b1";
  const board: Board = {
    id: bid,
    title: "Board",
    color: "#ff4d6d",
    order: 0,
    createdAt: nowISO(),
  };
  ws.boards.push(board);
  const cols: Column[] = (options.columnIds ?? ["c1", "c2"]).map((id, i) => ({
    id,
    boardId: bid,
    title: `col ${i + 1}`,
    order: i,
    wipLimit: null,
    done: id === "done",
  }));
  ws.columns.push(...cols);
  return ws;
}