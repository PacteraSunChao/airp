import { assertDiagnosticCodeCoverage } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import { DIAGNOSTICS_DIAGNOSTIC_CODES } from "../src/diagnostic-codes.js";

describe("diagnostics diagnostic-code coverage", () => {
  it("covers every registered diagnostics diagnostic code", () => {
    expect(() =>
      assertDiagnosticCodeCoverage(DIAGNOSTICS_DIAGNOSTIC_CODES)
    ).not.toThrow();
  });
});
