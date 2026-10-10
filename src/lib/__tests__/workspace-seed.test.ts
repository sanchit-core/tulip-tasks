import { describe, expect, it } from "vitest";
import { mkWorkspace } from "./helpers";
import { seedWorkspace } from "$lib/seed";
import { emptyWorkspace, nowISO } from "$lib/workspace";

describe("seed", () => {
  it("creates a demo workspace with boards, columns and tasks", () => {
    const ws = seedWorkspace();
    expect(ws.boards.length).toBe(2);
    expect(ws.columns.length).toBeGreaterThan(4);
    expect(ws.tasks.length).toBeGreaterThan(5);
  });
});

describe("workspace", () => {
  it("emptyWorkspace has sane defaults and nowISO is a valid ISO string", () => {
    const ws = emptyWorkspace();
    expect(ws.version).toBe(1);
    expect(Array.isArray(ws.boards)).toBe(true);
    expect(Number.isNaN(new Date(nowISO()).getTime())).toBe(false);
  });
});