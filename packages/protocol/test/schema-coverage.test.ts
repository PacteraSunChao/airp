import { assertSchemaCoverage } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import { schemaCases } from "./schema-cases.js";

const DOCUMENT_SCHEMA_REFS = ["document.schema.json"];

describe("schema coverage", () => {
  it("covers document.schema.json with valid and invalid cases", () => {
    expect(() =>
      assertSchemaCoverage(DOCUMENT_SCHEMA_REFS, schemaCases)
    ).not.toThrow();
  });
});
