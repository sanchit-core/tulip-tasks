import { describe, expect, it } from "vitest";
import { coerceWorkspace, parseWorkspace, toWorkspaceFile } from "$lib/persist";

describe("persist", () => {
  it("toWorkspaceFile wraps the workspace", () => {
    const ws = { version: 1, boards: [], columns: [], tasks: [], settings: {
      notificationsEnabled: true, notifyHour: 9, wipWarnings: true, hideTitlebar: false, theme: "neo-brutalist"
    } } as any;
    const f = toWorkspaceFile(ws);
    expect(f.app).toBe("Tulip Tasks");
    expect(f.workspace).toBe(ws);
  });

  it("coerceWorkspace applies safe defaults", () => {
    const raw = JSON.stringify({ boards: [], tasks: [{ id: "t1", tags: "x", subtasks: null }], columns: [], settings: { theme: "nonsense" } });
    const ws = parseWorkspace(raw);
    expect(ws).not.toBeNull();
    expect(ws!.tasks[0].tags).toEqual([]);
    expect(ws!.tasks[0].subtasks).toEqual([]);
    expect(ws!.tasks[0].title).toBe("Untitled task");
    expect(ws!.settings.theme).toBe("neo-brutalist");
  });

  it("parseWorkspace rejects invalid JSON", () => {
    expect(parseWorkspace("nope")).toBeNull();
    expect(coerceWorkspace(null)).toBeNull();
  });
});