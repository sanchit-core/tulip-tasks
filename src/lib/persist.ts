import {
  DEFAULT_SETTINGS,
  THEMES,
  WORKSPACE_VERSION,
  type Settings,
  type Theme,
  type Workspace,
  type WorkspaceFile,
} from "./types";

export const WORKSPACE_FILE = "workspace.json";
const LS_KEY = "tulip-kanban.workspace.v1";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Absolute path to `workspace.json` inside the platform app-data dir. */
async function workspacePath(): Promise<string> {
  const { appDataDir, join } = await import("@tauri-apps/api/path");
  return join(await appDataDir(), WORKSPACE_FILE);
}

export async function readWorkspace(): Promise<Workspace | null> {
  if (isTauri()) {
    try {
      const { exists, readTextFile } = await import("@tauri-apps/plugin-fs");
      const path = await workspacePath();
      if (!(await exists(path))) return null;
      const raw = await readTextFile(path);
      return parseWorkspace(raw);
    } catch {
      return null;
    }
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? parseWorkspace(raw) : null;
  } catch {
    return null;
  }
}

export async function writeWorkspace(ws: Workspace): Promise<void> {
  const json = JSON.stringify(ws, null, 2);
  if (isTauri()) {
    try {
      const { exists, mkdir, writeTextFile } = await import("@tauri-apps/plugin-fs");
      const { dirname } = await import("@tauri-apps/api/path");
      const path = await workspacePath();
      const dir = await dirname(path);
      if (!(await exists(dir))) await mkdir(dir, { recursive: true });
      await writeTextFile(path, json);
      return;
    } catch {
      /* fall through to the browser store so data is never lost on a write error */
    }
  }
  try {
    localStorage.setItem(LS_KEY, json);
  } catch {
    /* ignore */
  }
}

export async function workspaceLocation(): Promise<string> {
  if (isTauri()) {
    try {
      return await workspacePath();
    } catch {
      /* ignore */
    }
  }
  return "browser local storage (no desktop shell detected)";
}

/**
 * Tolerant parser: anything missing gets a safe default so a hand-edited or
 * older file can still be opened instead of hard-failing the whole app.
 */
export function parseWorkspace(raw: string): Workspace | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  return coerceWorkspace(data);
}

export function coerceWorkspace(data: unknown): Workspace | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Partial<WorkspaceFile> & Partial<Workspace>;
  const body = (root.workspace ?? root) as Partial<Workspace>;
  if (!body || typeof body !== "object") return null;

  const tasks = Array.isArray(body.tasks) ? body.tasks : [];
  const columns = Array.isArray(body.columns) ? body.columns : [];
  const boards = Array.isArray(body.boards) ? body.boards : [];

  return {
    version: WORKSPACE_VERSION,
    boards: boards.filter((b) => b && typeof b.id === "string"),
    columns: columns.filter((c) => c && typeof c.id === "string"),
    tasks: tasks
      .filter((t) => t && typeof t.id === "string")
      .map((t) => ({
        ...t,
        tags: Array.isArray(t.tags) ? t.tags : [],
        subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
        recurrence: t.recurrence ?? { kind: "none", interval: 1 },
        columnId: typeof t.columnId === "string" ? t.columnId : null,
        due: typeof t.due === "string" ? t.due : null,
        notes: typeof t.notes === "string" ? t.notes : "",
        title: typeof t.title === "string" && t.title ? t.title : "Untitled task",
        priority: t.priority ?? "medium",
        order: Number.isFinite(t.order) ? t.order : 0,
      })),
    settings: {
      ...DEFAULT_SETTINGS,
      ...(body.settings ?? {}),
      theme: THEMES.includes((body.settings as any)?.theme as Theme)
        ? ((body.settings as Settings).theme as Theme)
        : DEFAULT_SETTINGS.theme,
    },
  };
}

export function toWorkspaceFile(ws: Workspace): WorkspaceFile {
  return {
    app: "Tulip Kanban",
    exportedAt: new Date().toISOString(),
    workspace: ws,
  };
}
