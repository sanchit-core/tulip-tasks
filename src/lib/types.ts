export type Priority = "low" | "medium" | "high" | "urgent";

export const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];

export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export type RecurrenceKind = "daily" | "weekly" | "monthly" | "yearly";

export interface Recurrence {
  kind: RecurrenceKind | "none";
  /** Repeat every N units. Always >= 1. */
  interval: number;
}

export const NO_RECURRENCE: Recurrence = { kind: "none", interval: 1 };

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  boardId: string;
  /** `null` means the task is sitting in the backlog inbox. */
  columnId: string | null;
  title: string;
  notes: string;
  priority: Priority;
  tags: string[];
  /** ISO `yyyy-mm-dd`, or null when unscheduled. */
  due: string | null;
  order: number;
  subtasks: Subtask[];
  recurrence: Recurrence;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  /** When set, this task is a pending spawn of a recurring parent. */
  spawnedFrom?: string | null;
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  order: number;
  /** null = unlimited */
  wipLimit: number | null;
  /** A done-column auto-completes tasks dragged into it. */
  done: boolean;
}

export interface Board {
  id: string;
  title: string;
  /** Hex accent used for the board chip. */
  color: string;
  order: number;
  createdAt: string;
}

export interface Settings {
  notificationsEnabled: boolean;
  /** Hour of day (0-23) for the daily due-date digest. */
  notifyHour: number;
  /** Warn when a board column is over its WIP limit. */
  wipWarnings: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: true,
  notifyHour: 9,
  wipWarnings: true,
};

export interface Workspace {
  version: number;
  boards: Board[];
  columns: Column[];
  tasks: Task[];
  settings: Settings;
}

export const WORKSPACE_VERSION = 1;

/** Shape of a `.json` file dropped on the app or picked via Import. */
export interface WorkspaceFile {
  app?: string;
  exportedAt?: string;
  workspace: Workspace;
}
