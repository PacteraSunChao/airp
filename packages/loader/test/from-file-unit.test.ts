import { documentPath } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import { loadDocumentFile } from "../src/node/index.js";

describe("loadDocumentFile unit", () => {
  it("returns input-unavailable for missing files", async () => {
    const result = await loadDocumentFile(documentPath("missing.airp.json"));
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.diagnostics[0]?.code).toBe("loader.node.input-unavailable");
  });
});
