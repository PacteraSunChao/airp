import { describe, expect, it } from "vitest";
import { atId110 } from "../src/validators/at-id/v1-1-0.js";

describe("atId110", () => {
  it("rejects missing @id on blocks", () => {
    const stage = atId110({
      schemaVersion: "1.1.0",
      blocks: [{ type: "paragraph", text: "x" }],
    });
    expect(stage.ok).toBe(false);
    expect(
      stage.diagnostics.some(
        (d) => d.code === "validate.validators.at-id.missing"
      )
    ).toBe(true);
  });

  it("rejects invalid @id pattern", () => {
    const stage = atId110({
      schemaVersion: "1.1.0",
      blocks: [{ type: "paragraph", text: "x", "@id": "BAD" }],
    });
    expect(stage.ok).toBe(false);
    expect(
      stage.diagnostics.some(
        (d) => d.code === "validate.validators.at-id.invalid-pattern"
      )
    ).toBe(true);
  });

  it("rejects duplicate @id across structured objects", () => {
    const stage = atId110({
      schemaVersion: "1.1.0",
      blocks: [
        {
          type: "checklist",
          "@id": "aaaaaaaaaa",
          items: [
            { label: "one", "@id": "bbbbbbbbbb" },
            { label: "two", "@id": "bbbbbbbbbb" },
          ],
        },
      ],
    });
    expect(stage.ok).toBe(false);
    expect(
      stage.diagnostics.some(
        (d) => d.code === "validate.validators.at-id.duplicate"
      )
    ).toBe(true);
  });

  it("accepts unique valid @id values", () => {
    const stage = atId110({
      schemaVersion: "1.1.0",
      meta: {
        title: "t",
        kind: "generic",
        createdAt: "2026-09-14T12:00:00.000Z",
        sourceRefs: [{ type: "path", value: "a", "@id": "cccccccccc" }],
      },
      blocks: [{ type: "paragraph", text: "x", "@id": "dddddddddd" }],
    });
    expect(stage.ok).toBe(true);
    expect(stage.diagnostics).toEqual([]);
  });
});
