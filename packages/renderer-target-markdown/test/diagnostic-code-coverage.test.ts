import { assertDiagnosticCodeCoverage } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import {
  RENDERER_TARGET_MARKDOWN_DIAGNOSTIC_CODES,
  UNIT_COVERED_RENDERER_TARGET_MARKDOWN_DIAGNOSTIC_CODES,
} from "../src/diagnostic-codes.js";
import { renderCases } from "./render-cases.js";

describe("diagnostic code coverage", () => {
  it("covers every registered markdown target diagnostic code", () => {
    const caseCodes = renderCases.flatMap((c) =>
      c.expect.ok ? [] : [c.expect.code]
    );
    expect(() =>
      assertDiagnosticCodeCoverage(
        RENDERER_TARGET_MARKDOWN_DIAGNOSTIC_CODES,
        {},
        [
          ...UNIT_COVERED_RENDERER_TARGET_MARKDOWN_DIAGNOSTIC_CODES,
          ...caseCodes,
        ]
      )
    ).not.toThrow();
  });
});
