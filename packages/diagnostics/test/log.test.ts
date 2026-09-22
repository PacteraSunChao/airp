import { describe, expect, it } from "vitest";
import {
  defineDiagnosticCode,
  diagnostic,
  logDiagnostic,
  logInternalError,
} from "../src/index";

const DEMO_ERROR = defineDiagnosticCode("demo.error", "error");

function captureLogger() {
  const warn: string[] = [];
  const error: string[] = [];
  const raw: string[] = [];
  return {
    warn,
    error,
    raw,
    log: {
      debug() {
        /* unused in these cases */
      },
      info() {
        /* unused in these cases */
      },
      warn(body: string) {
        warn.push(body);
      },
      error(body: string) {
        error.push(body);
      },
      raw(line: string) {
        raw.push(line);
      },
    },
  };
}

describe("@airp/diagnostics log*", () => {
  it("logs warnings and errors via Logger", () => {
    const { log, warn, error } = captureLogger();
    logDiagnostic(log, diagnostic(DEMO_ERROR, "hard"));
    logDiagnostic(
      log,
      diagnostic({ code: "x.soft", severity: "warning" }, "soft")
    );
    expect(error[0]).toContain("demo.error: hard");
    expect(warn[0]).toContain("x.soft: soft");
  });

  it("logs internal error and stack lines", () => {
    const { log, error, raw } = captureLogger();
    const boom = new Error("boom");
    boom.stack = "Error: boom\n    at fake.ts:1:1";
    logInternalError(log, boom);
    expect(error[0]).toBe("internal error: boom");
    expect(raw[0]).toContain("at fake.ts:1:1");
  });
});
