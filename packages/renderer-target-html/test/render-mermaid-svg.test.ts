import { beforeEach, describe, expect, it, vi } from "vitest";
import { RENDERER_TARGETS_HTML_MERMAID_RENDER_FAILED } from "../src/diagnostic-codes.js";

vi.mock("../src/node/load-mermaid.js", () => ({
  loadMermaid: vi.fn(() =>
    Promise.resolve({
      initialize: vi.fn(),
      render: vi.fn(() =>
        Promise.reject(new Error("simulated render failure"))
      ),
    })
  ),
}));

describe("renderMermaidSvg", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws mermaid.render-failed warning diagnostic", async () => {
    const { renderMermaidSvg } = await import(
      "../src/node/render-mermaid-svg.js"
    );
    try {
      await renderMermaidSvg("flowchart LR\n A-->B", "airp-mmd-x");
      throw new Error("expected render failure");
    } catch (error) {
      expect(error).toMatchObject({
        name: "AirpDiagnosticError",
        diagnostics: [
          expect.objectContaining({
            code: RENDERER_TARGETS_HTML_MERMAID_RENDER_FAILED.code,
            severity: "warning",
          }),
        ],
      });
    }
  });
});
