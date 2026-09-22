import { assertDiagnosticCodeCoverage } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import {
  PROTOCOL_DIAGNOSTIC_CODES,
  UNIT_COVERED_PROTOCOL_DIAGNOSTIC_CODES,
} from "../src/diagnostic-codes.js";
import { schemaCases } from "./schema-cases.js";

describe("diagnostic code coverage", () => {
  it("covers every registered protocol diagnostic code", () => {
    expect(() =>
      assertDiagnosticCodeCoverage(
        PROTOCOL_DIAGNOSTIC_CODES,
        { schemaCases },
        UNIT_COVERED_PROTOCOL_DIAGNOSTIC_CODES
      )
    ).not.toThrow();
  });
});
