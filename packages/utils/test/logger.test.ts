import { describe, expect, it } from "vitest";
import {
  createLogger,
  formatTimestamp,
  LEVEL_TAG,
  renderLogLine,
} from "../src/logger";

const UTC_OFFSET_PREFIX = /^\[UTC[+-]\d+]/;

describe("logger core", () => {
  it("exposes fixed level tags", () => {
    expect(LEVEL_TAG.info).toBe("INFO");
  });

  it("formats a local-offset timestamp", () => {
    const stamp = formatTimestamp(new Date("2026-09-14T12:00:00.000Z"));
    expect(stamp).toMatch(UTC_OFFSET_PREFIX);
  });

  it("renders labeled lines through the sink", () => {
    const lines: string[] = [];
    const log = createLogger(
      {
        write(entry) {
          if (entry.kind === "raw") {
            lines.push(entry.text);
            return;
          }
          lines.push(renderLogLine(entry.parts, (_l, _r, text) => text));
        },
      },
      { now: () => new Date("2026-09-14T12:00:00.000Z") }
    );
    log.info("hello");
    expect(lines[0]).toContain("INFO");
    expect(lines[0]).toContain("hello");
  });
});
