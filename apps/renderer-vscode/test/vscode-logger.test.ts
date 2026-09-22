import { styleText } from "node:util";
import { describe, expect, it } from "vitest";
import { createVscodeLogger } from "../src/vscode-logger";

describe("createVscodeLogger", () => {
  it("writes labeled lines with timestamps and ANSI tags", () => {
    const lines: string[] = [];
    const log = createVscodeLogger(
      {
        appendLine: (value) => {
          lines.push(value);
        },
      },
      { now: () => new Date("2026-01-01T00:00:00.000Z") }
    );
    log.info("Rendered");
    log.error("hard");
    log.raw("    at foo");
    expect(lines[0]).toContain(styleText("green", "INFO"));
    expect(lines[0]).toContain("Rendered");
    expect(lines[1]).toContain(styleText("red", "ERROR"));
    expect(lines[2]).toBe("    at foo");
  });
});
