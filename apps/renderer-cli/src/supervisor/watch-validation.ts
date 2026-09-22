import type { RenderTarget } from "@airp/renderer";
import { UsageError } from "@airp/utils/node";

export interface WatchModeState {
  explicitServe: boolean;
  out: string | null;
  servePort: number;
  target: RenderTarget;
}

export function validateWatchModes(state: WatchModeState): void {
  if (state.explicitServe && state.target !== "html") {
    throw new UsageError("--serve is only valid with --target html");
  }
  if (state.explicitServe === false && state.servePort !== 4173) {
    throw new UsageError("--serve-port requires --serve");
  }
  if (state.target === "html") {
    if (!(state.explicitServe || state.out)) {
      throw new UsageError("html watch requires --serve and/or --out");
    }
    return;
  }
  if (state.explicitServe) {
    throw new UsageError("--serve is only valid with --target html");
  }
  if (!state.out) {
    throw new UsageError(`--out is required for --target ${state.target}`);
  }
}
