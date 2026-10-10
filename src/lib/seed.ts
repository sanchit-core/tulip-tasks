import { toISO } from "./dates";
import { uid } from "./ids";
import type { Board, Task, Workspace } from "./types";
import { emptyWorkspace, nowISO } from "./workspace";

/** The demo workspace shown on a fresh install. */
export function seedWorkspace(): Workspace {
  const ws = emptyWorkspace();
  const today = new Date();
  const at = (offset: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return toISO(d);
  };

  const mk = (
    boardId: string,
    columnId: string | null,
    title: string,
    extra: Partial<Task> = {},
  ): Task => ({
    id: uid("tk"),
    boardId,
    columnId,
    title,
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
    ...extra,
  });

  const build = (
    title: string,
    color: string,
    columns: string[],
    tasks: (boardId: string, cols: Record<string, string>) => Task[],
  ): Board => {
    const board: Board = {
      id: uid("bd"),
      title,
      color,
      order: ws.boards.length,
      createdAt: nowISO(),
    };
    ws.boards.push(board);
    const colIds: Record<string, string> = {};
    columns.forEach((name, i) => {
      const id = uid("cl");
      colIds[name] = id;
      ws.columns.push({
        id,
        boardId: board.id,
        title: name,
        order: i,
        wipLimit: name === "In Progress" ? 3 : null,
        done: name === "Done",
      });
    });
    ws.tasks.push(...tasks(board.id, colIds));
    return board;
  };

  build("Personal", "#ff4d6d", ["To Do", "In Progress", "Review", "Done"], (boardId, cols) => {
    const out: Task[] = [
      mk(boardId, null, "Renew passport", { tags: ["admin", "urgent"], priority: "urgent", due: at(9) }),
      mk(boardId, null, "Look into a standing desk", { tags: ["shopping"] }),
      mk(boardId, cols["To Do"], "Book dentist appointment", {
        tags: ["health"],
        priority: "high",
        due: at(2),
      }),
      mk(boardId, cols["To Do"], "Plan weekend trip", {
        notes: "Somewhere cheap, ideally with a train connection.",
        tags: ["travel"],
        subtasks: [
          { id: uid("sb"), title: "Pick two destinations", done: true },
          { id: uid("sb"), title: "Compare train prices", done: false },
          { id: uid("sb"), title: "Check leave days", done: false },
        ],
      }),
      mk(boardId, cols["In Progress"], "Finish the balcony repaint", {
        priority: "high",
        due: at(-2),
        tags: ["home"],
      }),
      mk(boardId, cols["In Progress"], "Weekly review", {
        due: at(0),
        recurrence: { kind: "weekly", interval: 1 },
        tags: ["ritual"],
      }),
      mk(boardId, cols["Review"], "Update CV", { tags: ["career"], due: at(6) }),
      mk(boardId, cols["Done"], "Cancel old subscription", {
        completedAt: nowISO(),
        tags: ["admin"],
      }),
    ];
    out.forEach((t, i) => {
      t.order = i;
    });
    return out;
  });

  build(
    "Work",
    "#7c6cf0",
    ["Backlog", "To Do", "In Progress", "Review", "Done"],
    (boardId, cols) => [
      mk(boardId, cols["Backlog"], "Draft Q3 roadmap", { tags: ["planning"], priority: "medium" }),
      mk(boardId, cols["Backlog"], "Evaluate new logging vendor", { tags: ["infra"] }),
      mk(boardId, cols["To Do"], "Fix flaky checkout test", {
        priority: "urgent",
        due: at(1),
        tags: ["bug"],
      }),
      mk(boardId, cols["In Progress"], "Migrate build to Nix", {
        notes: "Reproducible builds for CI. Watch out for the sandbox paths.",
        tags: ["infra", "tooling"],
        priority: "high",
        due: at(4),
        subtasks: [
          { id: uid("sb"), title: "Pin flake inputs", done: true },
          { id: uid("sb"), title: "Swap CI actions", done: false },
        ],
      }),
      mk(boardId, cols["In Progress"], "Standup", {
        due: at(0),
        recurrence: { kind: "daily", interval: 1 },
        tags: ["ritual"],
      }),
      mk(boardId, cols["Review"], "Write incident postmortem", {
        priority: "high",
        tags: ["docs"],
        due: at(-1),
      }),
      mk(boardId, cols["Done"], "Ship dark mode", { completedAt: nowISO(), tags: ["feature"] }),
    ],
  );

  return ws;
}
