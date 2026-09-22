/** Quiet window — aligned with SSP renderer-vscode default. */
export const WATCH_DEBOUNCE_MS = 1000;

export type WatchEventKind = "change" | "create" | "delete" | "save";

export type WatchLogKind = "change" | "create" | "delete";

export interface WatchChange {
  kind: WatchLogKind;
  path: string;
}

/** `Watch [kind]path, …` — last kind per path, then sorted by path. */
export function formatWatchLogLine(
  changes: readonly { kind: string; path: string }[]
): string {
  return `Watch ${changes.map((entry) => `[${entry.kind}]${entry.path}`).join(", ")}`;
}

function toWatchLogKind(kind: WatchEventKind): WatchLogKind {
  return kind === "save" ? "change" : kind;
}

/** Accumulates watch events between debounced fires. */
export class WatchEventBuffer {
  private readonly byPath = new Map<string, WatchLogKind>();

  note(fsPath: string, kind: WatchEventKind): void {
    this.byPath.set(fsPath, toWatchLogKind(kind));
  }

  drain(): WatchChange[] {
    const entries = [...this.byPath.entries()]
      .map(([path, kind]) => ({ kind, path }))
      .sort((left, right) => left.path.localeCompare(right.path));
    this.byPath.clear();
    return entries;
  }

  clear(): void {
    this.byPath.clear();
  }
}

export type DebouncedRun = () => void | Promise<void>;

/**
 * Quiet debounce + serial trailing: while a run is in flight, at most one
 * additional run is queued for after it finishes.
 */
export class DebouncedSerialRunner {
  private readonly debounceMs: number;
  private readonly run: DebouncedRun;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private inflight: Promise<void> | undefined;
  private trailing = false;

  constructor(run: DebouncedRun, debounceMs = WATCH_DEBOUNCE_MS) {
    this.run = run;
    this.debounceMs = debounceMs;
  }

  /** Schedule a trailing run after quiet. */
  kick(debounceMs = this.debounceMs): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      this.enqueue();
    }, debounceMs);
  }

  /** Cancel pending debounce (does not abort an in-flight run). */
  clear(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
    this.trailing = false;
  }

  private enqueue(): void {
    if (this.inflight) {
      this.trailing = true;
      return;
    }
    this.inflight = Promise.resolve()
      .then(() => this.run())
      .then(
        () => undefined,
        () => undefined
      )
      .finally(() => {
        this.inflight = undefined;
        if (this.trailing) {
          this.trailing = false;
          this.enqueue();
        }
      });
  }
}
