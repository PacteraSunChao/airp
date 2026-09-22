import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import chokidar, { type FSWatcher } from "chokidar";

/** Quiet window before coalesce `onChange` (shared for input + renderer dist). */
export const CHANGE_WATCHER_DEBOUNCE_MS = 750;

const ROOT_RECOVERY_POLL_MS = 400;

function waitForWatcherReady(watcher: FSWatcher): Promise<void> {
  return new Promise((resolve) => {
    watcher.once("ready", resolve);
  });
}

/** mtimeMs:size — filters FSEvents sibling noise when only `.d.mts` changes. */
function mjsFingerprint(filePath: string): string | undefined {
  try {
    const stats = statSync(filePath);
    if (!stats.isFile()) {
      return undefined;
    }
    return `${stats.mtimeMs}:${stats.size}`;
  } catch {
    return undefined;
  }
}

function seedMjsFingerprints(
  distDir: string,
  fingerprints: Map<string, string>
): void {
  if (!existsSync(distDir)) {
    return;
  }
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.isFile() || path.extname(fullPath) !== ".mjs") {
        continue;
      }
      const fingerprint = mjsFingerprint(fullPath);
      if (fingerprint) {
        fingerprints.set(path.resolve(fullPath), fingerprint);
      }
    }
  };
  walk(distDir);
}

/** Dist change label in watch log lines. */
export const RENDERER_DIST_WATCH_PATH = "renderer dist";

export type ProjectWatchKind = "add" | "change" | "unlink";

export interface WatchChange {
  kind: ProjectWatchKind;
  path: string;
}

export interface ChangeWatcherOptions {
  /** Override the quiet window in tests. */
  debounceMs?: number;
  /** Absolute path of the single `*.airp.json` input file. */
  inputFile: string;
  /** Fires once after CHANGE_WATCHER_DEBOUNCE_MS of quiet with coalesced changes. */
  onChange: (changes: WatchChange[]) => void;
  /**
   * Fires immediately on each qualifying change (kill live worker).
   * Debounce does not delay this callback.
   */
  onInterrupt: () => void;
  /** When set (CLI dev), also watch generated HTML target modules in `dist/`. */
  rendererDistDir: string | null;
}

/** `Watch [kind]path, …` — last kind per path, then sorted by path. */
export function formatWatchLogLine(
  changes: readonly { kind: string; path: string }[]
): string {
  return `Watch ${changes.map((entry) => `[${entry.kind}]${entry.path}`).join(", ")}`;
}

/**
 * Watches a single AIRP document file and optional renderer `dist/` modules.
 * Qualifying change → immediate `onInterrupt`; quiet for
 * CHANGE_WATCHER_DEBOUNCE_MS → one coalesced `onChange`.
 */
export class ChangeWatcher {
  private readonly changed = new Map<string, ProjectWatchKind>();
  private readonly mjsFingerprints = new Map<string, string>();
  private readonly options: ChangeWatcherOptions;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private rootRecoveryTimer: ReturnType<typeof setInterval> | undefined;
  private fileWatcher: FSWatcher | undefined;
  private distWatcher: FSWatcher | undefined;

  constructor(options: ChangeWatcherOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    const ready: Promise<void>[] = [];
    const fileWatcher = this.attachFileWatcher();
    if (fileWatcher) {
      ready.push(waitForWatcherReady(fileWatcher));
    }

    const rendererDistDir = this.options.rendererDistDir;
    if (rendererDistDir) {
      const resolvedDistDir = path.resolve(rendererDistDir);
      const rendererPackageDir = path.dirname(resolvedDistDir);
      this.distWatcher = chokidar.watch(rendererPackageDir, {
        ignoreInitial: true,
        ignored: (watchPath) => {
          const resolvedPath = path.resolve(watchPath);
          return !(
            resolvedPath === rendererPackageDir ||
            resolvedPath === resolvedDistDir ||
            resolvedPath.startsWith(`${resolvedDistDir}${path.sep}`)
          );
        },
      });
      this.distWatcher.on("all", (event, filePath) => {
        this.handleDistEvent(event, filePath, resolvedDistDir);
      });
      ready.push(waitForWatcherReady(this.distWatcher));
    }
    await Promise.all(ready);
    if (rendererDistDir) {
      seedMjsFingerprints(path.resolve(rendererDistDir), this.mjsFingerprints);
    }
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.clearRootRecoveryPoll();
    await Promise.all([this.fileWatcher?.close(), this.distWatcher?.close()]);
    this.fileWatcher = undefined;
    this.distWatcher = undefined;
  }

  private handleDistEvent(
    event: string,
    filePath: string | undefined,
    resolvedDistDir: string
  ): void {
    if (!filePath) {
      return;
    }
    const resolvedPath = path.resolve(filePath);
    const underDist =
      resolvedPath === resolvedDistDir ||
      resolvedPath.startsWith(`${resolvedDistDir}${path.sep}`);
    if (!underDist) {
      return;
    }

    if (event === "unlinkDir") {
      for (const key of [...this.mjsFingerprints.keys()]) {
        if (
          key === resolvedPath ||
          key.startsWith(`${resolvedPath}${path.sep}`)
        ) {
          this.mjsFingerprints.delete(key);
        }
      }
      return;
    }

    if (event !== "add" && event !== "change" && event !== "unlink") {
      return;
    }
    if (path.extname(resolvedPath) !== ".mjs") {
      return;
    }

    if (event === "unlink") {
      this.mjsFingerprints.delete(resolvedPath);
      this.noteChange(RENDERER_DIST_WATCH_PATH, "change");
      return;
    }

    const fingerprint = mjsFingerprint(resolvedPath);
    if (!fingerprint) {
      return;
    }
    if (this.mjsFingerprints.get(resolvedPath) === fingerprint) {
      return;
    }
    this.mjsFingerprints.set(resolvedPath, fingerprint);
    this.noteChange(RENDERER_DIST_WATCH_PATH, "change");
  }

  private drainChanged(): WatchChange[] {
    const changes = [...this.changed.entries()]
      .map(([path, kind]) => ({ kind, path }))
      .sort((left, right) => left.path.localeCompare(right.path));
    this.changed.clear();
    return changes;
  }

  private attachFileWatcher(): FSWatcher | undefined {
    const inputFile = path.resolve(this.options.inputFile);

    if (!existsSync(inputFile)) {
      this.startRootRecoveryPoll(inputFile);
      return undefined;
    }

    this.fileWatcher = chokidar.watch(inputFile, { ignoreInitial: true });
    this.fileWatcher.on("all", (event, filePath) => {
      if (!filePath) {
        return;
      }
      if (event !== "add" && event !== "change" && event !== "unlink") {
        return;
      }
      this.noteChange(path.basename(inputFile), event);
    });
    this.fileWatcher.on("error", () => {
      this.handleFileRemoved(inputFile).catch(() => {
        // Recovery poll still starts after close failures.
      });
    });
    return this.fileWatcher;
  }

  private async handleFileRemoved(inputFile: string): Promise<void> {
    if (this.fileWatcher) {
      await this.fileWatcher.close();
      this.fileWatcher = undefined;
    }
    this.startRootRecoveryPoll(inputFile);
  }

  private startRootRecoveryPoll(inputFile: string): void {
    if (this.rootRecoveryTimer) {
      return;
    }
    this.rootRecoveryTimer = setInterval(() => {
      if (!existsSync(inputFile)) {
        return;
      }
      this.clearRootRecoveryPoll();
      this.attachFileWatcher();
      this.noteChange(path.basename(inputFile), "add");
    }, ROOT_RECOVERY_POLL_MS);
  }

  private clearRootRecoveryPoll(): void {
    if (this.rootRecoveryTimer) {
      clearInterval(this.rootRecoveryTimer);
      this.rootRecoveryTimer = undefined;
    }
  }

  private noteChange(relPath: string, kind: ProjectWatchKind): void {
    this.changed.set(relPath, kind);
    this.options.onInterrupt();
    this.scheduleQuietRender();
  }

  private scheduleQuietRender(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      const changes = this.drainChanged();
      if (changes.length === 0) {
        return;
      }
      this.options.onChange(changes);
    }, this.options.debounceMs ?? CHANGE_WATCHER_DEBOUNCE_MS);
  }
}
