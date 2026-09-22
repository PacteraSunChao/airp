import { type ChildProcess, fork } from "node:child_process";
import path from "node:path";
import type { Uri } from "vscode";
import type {
  HostToRenderWorkerMessage,
  RenderJobRecipe,
  RenderWorkerToHostMessage,
} from "./workers/ipc";

const WORKER_KILL_TIMEOUT_MS = 5000;

export interface WorkerSlotHost {
  extensionUri: Uri;
}

interface PendingRender {
  jobId: number;
  resolve: (
    message: Extract<RenderWorkerToHostMessage, { type: "result" }>
  ) => void;
}

/**
 * Single live worker slot: fork + ELECTRON_RUN_AS_NODE.
 * New job or interrupt kills the current child first.
 */
export class WorkerSlot {
  private readonly host: WorkerSlotHost;
  private child: ChildProcess | undefined;
  private pending: PendingRender | undefined;
  private jobSeq = 0;
  private killTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(host: WorkerSlotHost) {
    this.host = host;
  }

  nextJobId(): number {
    this.jobSeq += 1;
    return this.jobSeq;
  }

  get activeJobId(): number | undefined {
    return this.pending?.jobId;
  }

  /** Kill the live worker if any (file change / new task / dispose). */
  killActive(): void {
    const pending = this.pending;
    this.pending = undefined;
    this.clearKillTimer();
    const child = this.child;
    this.child = undefined;
    if (!child || child.killed || child.exitCode !== null) {
      return;
    }
    child.kill("SIGTERM");
    this.killTimer = setTimeout(() => {
      if (!child.killed && child.exitCode === null) {
        child.kill("SIGKILL");
      }
    }, WORKER_KILL_TIMEOUT_MS);
    if (pending) {
      pending.resolve({
        type: "result",
        jobId: pending.jobId,
        ok: false,
        cancelled: true,
        diagnostics: [
          {
            code: "internal",
            severity: "error",
            message: "Worker killed",
          },
        ],
      });
    }
  }

  async runRender(
    recipe: Omit<RenderJobRecipe, "jobId">
  ): Promise<Extract<RenderWorkerToHostMessage, { type: "result" }>> {
    this.killActive();
    const jobId = this.nextJobId();
    const fullRecipe: RenderJobRecipe = { ...recipe, jobId };
    const workerPath = path.join(
      this.host.extensionUri.fsPath,
      "dist",
      "render-worker.cjs"
    );
    const child = fork(workerPath, [], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
      execPath: process.execPath,
      stdio: ["ignore", "inherit", "inherit", "ipc"],
    });
    this.child = child;

    return await new Promise((resolve) => {
      this.pending = { jobId, resolve };

      const finishIfCurrent = (
        result: Extract<RenderWorkerToHostMessage, { type: "result" }>
      ): void => {
        if (this.pending?.jobId !== jobId) {
          return;
        }
        const pending = this.pending;
        this.pending = undefined;
        this.clearKillTimer();
        if (this.child === child) {
          this.child = undefined;
        }
        pending.resolve(result);
      };

      child.on("message", (raw: unknown) => {
        if (this.pending?.jobId !== jobId) {
          return;
        }
        if (typeof raw !== "object" || raw === null || !("type" in raw)) {
          return;
        }
        const msg = raw as RenderWorkerToHostMessage;
        if (msg.type === "stage") {
          return;
        }
        if (msg.type === "result") {
          finishIfCurrent(msg);
        }
      });

      child.on("exit", (code, signal) => {
        if (this.pending?.jobId !== jobId) {
          return;
        }
        const message =
          signal == null
            ? `Worker exited with code ${code ?? 1}`
            : `Worker exited with signal ${signal}`;
        finishIfCurrent({
          type: "result",
          jobId,
          ok: false,
          diagnostics: [{ code: "internal", severity: "error", message }],
        });
      });

      child.send({
        type: "run",
        recipe: fullRecipe,
      } satisfies HostToRenderWorkerMessage);
    });
  }

  private clearKillTimer(): void {
    if (this.killTimer) {
      clearTimeout(this.killTimer);
      this.killTimer = undefined;
    }
  }
}
