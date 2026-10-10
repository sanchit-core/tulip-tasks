import { describe, expect, it } from "vitest";
import { uid } from "$lib/ids";

describe("uid", () => {
  it("is unique within a run", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => uid()));
    expect(ids.size).toBe(1000);
  });

  it("carries the requested prefix", () => {
    expect(uid("tk").startsWith("tk_")).toBe(true);
    expect(uid("bd").startsWith("bd_")).toBe(true);
  });
});