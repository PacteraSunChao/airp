import { assertDiagnosticCodeCoverage } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import {
  UNIT_COVERED_VALIDATE_DIAGNOSTIC_CODES,
  VALIDATE_DIAGNOSTIC_CODES,
} from "../src/diagnostic-codes.js";
import { pipelineCases } from "./pipeline-cases.js";

describe("diagnostic code coverage", () => {
  it("covers every registered validate diagnostic code", () => {
    const ownedPipelineCases = pipelineCases.map((c) => {
      if (c.expect.ok) {
        return c;
      }
      return {
        ...c,
        expect: {
          ...c.expect,
          codes: c.expect.codes.filter((code) =>
            VALIDATE_DIAGNOSTIC_CODES.includes(
              code as (typeof VALIDATE_DIAGNOSTIC_CODES)[number]
            )
          ),
        },
      };
    });
    expect(() =>
      assertDiagnosticCodeCoverage(
        VALIDATE_DIAGNOSTIC_CODES,
        { pipelineCases: ownedPipelineCases },
        UNIT_COVERED_VALIDATE_DIAGNOSTIC_CODES
      )
    ).not.toThrow();
  });
});
