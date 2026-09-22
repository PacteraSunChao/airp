import { styleText } from "node:util";
import type { LogLevel, LogPaint, LogPaintRole } from "../logger.js";

export interface ColorizeStream {
  isTTY?: boolean;
}

export type Colorize = boolean | ((level: LogLevel) => boolean);

export interface CreateNodePaintOptions {
  colorize?: Colorize;
}

type Style = Parameters<typeof styleText>[0];

const TAG_STYLES: Record<LogLevel, Style> = {
  debug: "gray",
  info: "green",
  warn: "yellow",
  error: "red",
};

function colorizeFromEnv(): boolean | undefined {
  if (process.env.NO_COLOR != null) {
    return false;
  }
  if (process.env.FORCE_COLOR != null) {
    return true;
  }
  return undefined;
}

/** Respect NO_COLOR / FORCE_COLOR, then fall back to stream.isTTY. */
export function shouldColorizeStream(stream?: ColorizeStream): boolean {
  const fromEnv = colorizeFromEnv();
  if (fromEnv !== undefined) {
    return fromEnv;
  }
  return stream?.isTTY === true;
}

function resolveColorize(
  level: LogLevel,
  colorize: Colorize | undefined,
  fallback: boolean
): boolean {
  if (typeof colorize === "function") {
    return colorize(level);
  }
  if (typeof colorize === "boolean") {
    return colorize;
  }
  return fallback;
}

/** Node ANSI paint for timestamp (dim), tag (by level), body (plain). */
export function createNodePaint(
  options: CreateNodePaintOptions = {}
): LogPaint {
  return (level: LogLevel, role: LogPaintRole, text: string) => {
    if (!resolveColorize(level, options.colorize, false)) {
      return text;
    }
    if (role === "timestamp") {
      return styleText("dim", text);
    }
    if (role === "tag") {
      return styleText(TAG_STYLES[level], text);
    }
    return text;
  };
}
