import {
  type CreateLoggerOptions,
  createLogger,
  type Logger,
  type LogSink,
  renderLogLine,
} from "@airp/utils";
import { createNodePaint } from "@airp/utils/node";

export interface VscodeLogSink {
  appendLine(value: string): void;
}

/** Logger sink for a VS Code OutputChannel (or any appendLine host). */
export function createVscodeLogger(
  output: VscodeLogSink,
  options: CreateLoggerOptions = {}
): Logger {
  const paint = createNodePaint({ colorize: true });

  const sink: LogSink = {
    write(entry) {
      if (entry.kind === "raw") {
        output.appendLine(entry.text);
        return;
      }
      output.appendLine(renderLogLine(entry.parts, paint));
    },
  };

  return createLogger(sink, options);
}
