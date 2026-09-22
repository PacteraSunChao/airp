import {
  type CreateLoggerOptions,
  createLogger,
  type Logger,
  type LogLevel,
  type LogSink,
  renderLogLine,
} from "../logger.js";
import {
  type ColorizeStream,
  createNodePaint,
  shouldColorizeStream,
} from "./logger-paint.js";

export interface CliLoggerStream extends ColorizeStream {
  write(chunk: string): void;
}

export interface CreateCliLoggerOptions extends CreateLoggerOptions {
  stderr?: CliLoggerStream;
  stdout?: CliLoggerStream;
}

export function streamForLevel(
  level: LogLevel | null,
  stdout: CliLoggerStream,
  stderr: CliLoggerStream
): CliLoggerStream {
  if (level === null || level === "warn" || level === "error") {
    return stderr;
  }
  return stdout;
}

export function createCliLogger(options: CreateCliLoggerOptions = {}): Logger {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const { stdout: _stdout, stderr: _stderr, ...loggerOptions } = options;

  const paint = createNodePaint({
    colorize: (level) =>
      shouldColorizeStream(streamForLevel(level, stdout, stderr)),
  });

  const sink: LogSink = {
    write(entry) {
      if (entry.kind === "raw") {
        stderr.write(`${entry.text}\n`);
        return;
      }
      const stream = streamForLevel(entry.parts.level, stdout, stderr);
      stream.write(`${renderLogLine(entry.parts, paint)}\n`);
    },
  };

  return createLogger(sink, loggerOptions);
}
