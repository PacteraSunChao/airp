import { readDocumentPayload } from "@airp/loader";
import { describe, expect, it } from "vitest";
import { withCliPayload } from "../src/payload.js";
import { validationSourceLabel } from "../src/render.js";

describe("withCliPayload", () => {
  it("stores the source path in document payload", () => {
    const payload = withCliPayload(undefined, {
      sourcePath: "/tmp/report.airp.json",
    });
    expect(readDocumentPayload(payload)?.sourcePath).toBe(
      "/tmp/report.airp.json"
    );
  });
});

describe("validationSourceLabel", () => {
  it("returns relative path when sourcePath is under cwd", () => {
    const payload = withCliPayload(undefined, {
      sourcePath: "/work/fixtures/doc.airp.json",
    });
    expect(validationSourceLabel({ payload }, "/work")).toBe(
      "fixtures/doc.airp.json"
    );
  });

  it("returns . when payload has no sourcePath", () => {
    expect(validationSourceLabel({ payload: {} })).toBe(".");
  });
});
