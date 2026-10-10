import { DEFAULT_SETTINGS, WORKSPACE_VERSION, type Workspace } from "./types";

/** Columns every freshly created board starts with. */
export const DEFAULT_COLUMNS = ["Backlog", "To Do", "In Progress", "Review", "Done"];

export function emptyWorkspace(): Workspace {
  return {
    version: WORKSPACE_VERSION,
    boards: [],
    columns: [],
    tasks: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

/** Current wall-clock time as an ISO timestamp (full date + time, unlike a due date). */
export function nowISO(): string {
  return new Date().toISOString();
}
