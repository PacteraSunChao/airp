import { assertDiagnosticCodeCoverage } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import { LOADER_DIAGNOSTIC_CODES } from "../src/diagnostic-codes.js";
import { loadCases } from "./load-cases.js";

const UNIT_COVERED = [
  "loader.load.not-object",
  "loader.load.schema-version-invalid",
  "loader.node.input-unavailable",
] as const;

describe("diagnostic code coverage", () => {
  it("covers every registered loader diagnostic code", () => {
    expect(() =>
      assertDiagnosticCodeCoverage(
        LOADER_DIAGNOSTIC_CODES,
        { loadCases },
        UNIT_COVERED
      )
    ).not.toThrow();
  });
});
