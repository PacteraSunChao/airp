export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogPaintRole = "timestamp" | "tag" | "body";

export type LogPaint = (
  level: LogLevel,
  role: LogPaintRole,
  text: string
) => string;

export const LEVEL_TAG: Record<LogLevel, string> = {
  debug: "DEBUG",
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

export interface LogParts {
  body: string;
  level: LogLevel;
  tag: string;
  timestamp: string;
}

export type LogSinkEntry =
  | { kind: "labeled"; parts: LogParts }
  | { kind: "raw"; text: string };

export interface LogSink {
  write(entry: LogSinkEntry): void;
}

export interface Logger {
  debug(body: string): void;
  error(body: string): void;
  info(body: string): void;
  raw(text: string): void;
  warn(body: string): void;
}

export interface CreateLoggerOptions {
  now?: () => Date;
}

export const noopPaint: LogPaint = (_level, _role, text) => text;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** `[UTC+8] 2026-01-28 12:05:05` using the runtime local timezone offset. */
export function formatTimestamp(now: Date): string {
  const offsetMin = -now.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const offsetHours = Math.floor(Math.abs(offsetMin) / 60);
  return `[UTC${sign}${offsetHours}] ${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
}

export function renderLogLine(parts: LogParts, paint: LogPaint): string {
  const timestamp = paint(parts.level, "timestamp", parts.timestamp);
  const tag = paint(parts.level, "tag", parts.tag);
  const body = paint(parts.level, "body", parts.body);
  return `${timestamp}  ${tag}  ${body}`;
}

/**
 * Core logger: builds structured parts and delegates rendering to the sink.
 * No paint, no I/O — hosts own both.
 */
export function createLogger(
  sink: LogSink,
  options: CreateLoggerOptions = {}
): Logger {
  const now = options.now ?? (() => new Date());

  const labeled = (level: LogLevel, body: string): void => {
    sink.write({
      kind: "labeled",
      parts: {
        level,
        timestamp: formatTimestamp(now()),
        tag: LEVEL_TAG[level],
        body,
      },
    });
  };

  return {
    debug(body) {
      labeled("debug", body);
    },
    info(body) {
      labeled("info", body);
    },
    warn(body) {
      labeled("warn", body);
    },
    error(body) {
      labeled("error", body);
    },
    raw(text) {
      sink.write({ kind: "raw", text });
    },
  };
}
