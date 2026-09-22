import { describe, expect, it } from "vitest";
import { DIAGNOSTICS_DIAGNOSTIC_CODES } from "../src/diagnostic-codes.js";
import {
  AirpDiagnosticError,
  airpResultFrom,
  defineDiagnosticCode,
  diagnostic,
  formatDiagnostic,
  prefixFile,
  withStage,
} from "../src/index";

const DEMO_ERROR = defineDiagnosticCode("demo.error", "error");
const DEMO_WARNING = defineDiagnosticCode("demo.warning", "warning");

describe("@airp/diagnostics", () => {
  it("owns an empty diagnostic catalog", () => {
    expect(DIAGNOSTICS_DIAGNOSTIC_CODES).toEqual([]);
  });

  it("prefixes file onto diagnostics", () => {
    const list = prefixFile(
      [diagnostic(DEMO_ERROR, "bad", { location: { path: "/" } })],
      "report.airp.json"
    );
    expect(list[0].location?.file).toBe("report.airp.json");
  });

  it("formats diagnostic body", () => {
    const { body } = formatDiagnostic(
      diagnostic(DEMO_ERROR, "must be string", {
        stage: "schema",
        location: { file: "report.airp.json", path: "/meta/title" },
      })
    );
    expect(body).toBe(
      "[schema] report.airp.json:/meta/title demo.error: must be string"
    );
  });

  it("derives ok from error diagnostics", () => {
    const ok = airpResultFrom([diagnostic(DEMO_WARNING, "soft")]);
    expect(ok.ok).toBe(true);
    const fail = airpResultFrom([diagnostic(DEMO_ERROR, "hard")]);
    expect(fail.ok).toBe(false);
  });

  it("withStage fills missing stage", () => {
    const list = withStage([diagnostic(DEMO_ERROR, "m")], "schema");
    expect(list[0].stage).toBe("schema");
  });

  it("AirpDiagnosticError carries diagnostics and uses first message", () => {
    const d = diagnostic(DEMO_ERROR, "missing file");
    const error = new AirpDiagnosticError([d]);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AirpDiagnosticError");
    expect(error.message).toBe("missing file");
    expect(error.diagnostics).toEqual([d]);
  });
});
