import { describe, expect, it } from "vitest";
import { buildSplitDiffLines } from "../src/shared/render-code-diff.js";

describe("buildSplitDiffLines", () => {
  it("marks changed lines as del/add and keeps equal lines", () => {
    const panes = buildSplitDiffLines(
      "export function emit(block: Block): string {\n  return JSON.stringify(block);\n}\n",
      "export function emit(block: Block, ctx: EmitContext): string {\n  return ctx.skins.render(block);\n}\n"
    );

    expect(panes.before.some((line) => line.kind === "del")).toBe(true);
    expect(panes.after.some((line) => line.kind === "add")).toBe(true);
    expect(panes.before.every((line) => line.kind !== "add")).toBe(true);
    expect(panes.after.every((line) => line.kind !== "del")).toBe(true);
  });
});
