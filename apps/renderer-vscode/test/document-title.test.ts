import { describe, expect, it } from "vitest";
import {
  documentTitleFromLoaded,
  resolveDocumentPanelTitle,
} from "../src/document-title";

describe("documentTitle", () => {
  it("uses a plain meta.title string", () => {
    expect(resolveDocumentPanelTitle("Hello", "AIRP Renderer")).toBe("Hello");
  });

  it("uses the first non-empty locale map value", () => {
    expect(
      resolveDocumentPanelTitle(
        { "zh-CN": "你好", en: "Hello" },
        "AIRP Renderer"
      )
    ).toBe("你好");
  });

  it("falls back when title is empty", () => {
    expect(resolveDocumentPanelTitle("  ", "AIRP Renderer")).toBe(
      "AIRP Renderer"
    );
    expect(resolveDocumentPanelTitle(undefined, "AIRP Renderer")).toBe(
      "AIRP Renderer"
    );
  });

  it("reads title from a loaded document object", () => {
    expect(
      documentTitleFromLoaded(
        { meta: { title: "Minimal report" } },
        "AIRP Renderer"
      )
    ).toBe("Minimal report");
  });
});
