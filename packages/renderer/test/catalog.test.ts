import { describe, expect, it } from "vitest";
import { isRenderTargetKey, rendererTargetCatalog } from "../src/index.js";

describe("rendererTargetCatalog", () => {
  it("binds the closed html and markdown targets", () => {
    expect(rendererTargetCatalog.html.target).toBe("html");
    expect(rendererTargetCatalog.markdown.target).toBe("markdown");
    expect(isRenderTargetKey("html")).toBe(true);
    expect(isRenderTargetKey("markdown")).toBe(true);
    expect(isRenderTargetKey("excel")).toBe(false);
  });
});
