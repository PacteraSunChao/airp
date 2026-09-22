import { describe, expect, it } from "vitest";
import type { RenderTarget } from "../src/index.js";

describe("renderer-contract", () => {
  it("exports the closed target union", () => {
    const targets: RenderTarget[] = ["html", "markdown"];
    expect(targets).toContain("html");
    expect(targets).toContain("markdown");
  });
});
