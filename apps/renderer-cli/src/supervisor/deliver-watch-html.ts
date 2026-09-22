import { readFile } from "node:fs/promises";
import path from "node:path";

export function formatReadFailureMessage(targetPath: string): string {
  return `Cannot read ${targetPath}: file missing or inaccessible`;
}

export interface DeliverWatchHtmlOptions {
  onReadError?: (message: string) => void;
  /** Called with raw primary bytes/text before live-reload injection. */
  onWatchHtml?: (body: string | Buffer) => void;
  primaryPath: string;
}

export interface DeliverWatchHtmlResult {
  watchHtml: string | Buffer | null;
}

/**
 * After worker success: load primary HTML for in-memory watch HTTP serve.
 */
export async function deliverWatchHtml(
  options: DeliverWatchHtmlOptions
): Promise<DeliverWatchHtmlResult> {
  if (!options.onWatchHtml) {
    return { watchHtml: null };
  }

  const primaryPath = path.resolve(options.primaryPath);
  try {
    const watchHtml = await readFile(primaryPath, "utf8");
    options.onWatchHtml(watchHtml);
    return { watchHtml };
  } catch (error) {
    const message = formatReadFailureMessage(primaryPath);
    if (options.onReadError) {
      options.onReadError(message);
      return { watchHtml: null };
    }
    throw new Error(message, { cause: error });
  }
}
