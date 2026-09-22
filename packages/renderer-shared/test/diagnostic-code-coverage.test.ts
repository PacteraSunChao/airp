import { assertDiagnosticCodeCoverage } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import {
  RENDERER_SHARED_DIAGNOSTIC_CODES,
  UNIT_COVERED_RENDERER_SHARED_DIAGNOSTIC_CODES,
} from "../src/diagnostic-codes.js";

describe("diagnostic code coverage", () => {
  it("covers every registered renderer-shared diagnostic code", () => {
    expect(() =>
      assertDiagnosticCodeCoverage(
        RENDERER_SHARED_DIAGNOSTIC_CODES,
        {},
        UNIT_COVERED_RENDERER_SHARED_DIAGNOSTIC_CODES
      )
    ).not.toThrow();
  });
});
