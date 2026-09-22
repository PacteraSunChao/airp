import { describe, expect, it } from "vitest";
import { loadDocument, loadDocumentJson } from "../src/index.js";

describe("loadDocument unit", () => {
  it("rejects non-object roots", () => {
    const result = loadDocument([]);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.diagnostics[0]?.code).toBe("loader.load.not-object");
  });

  it("rejects missing schemaVersion", () => {
    const result = loadDocument({ meta: {} });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.diagnostics[0]?.code).toBe(
      "loader.load.schema-version-invalid"
    );
  });

  it("parses valid JSON text", () => {
    const result = loadDocumentJson(
      JSON.stringify({
        schemaVersion: "1.0.0",
        blocks: [],
      })
    );
    expect(result.ok).toBe(true);
  });
});
