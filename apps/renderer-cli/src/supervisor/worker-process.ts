import { type ChildProcess, spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RenderTarget } from "@airp/renderer";
import type { RendererCliScene } from "../command-types.js";

const require = createRequire(import.meta.url);

const WORKER_KILL_TIMEOUT_MS = 5000;

export interface SpawnRenderWorkerOptions {
  input: string;
  outFile: string;
  scene: RendererCliScene;
  target: RenderTarget;
}

export interface RenderWorkerHandle {
  child: ChildProcess;
  /** Resolves with process exit code. */
  exitCode: Promise<number>;
  kill(): Promise<void>;
}

function resolveCliEntryPath(): string {
  const argvEntry = process.argv[1];
  if (argvEntry && (argvEntry.endsWith(".ts") || argvEntry.endsWith(".mjs"))) {
    return path.resolve(argvEntry);
  }
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "../cli.ts");
}

function buildSpawnArgs(options: SpawnRenderWorkerOptions): {
  command: string;
  args: string[];
} {
  const cliEntry = resolveCliEntryPath();
  const workerArgs = [
    "worker",
    "--input",
    options.input,
    "--target",
    options.target,
    "--out",
    options.outFile,
    "--scene",
    options.scene,
  ];
  if (cliEntry.endsWith(".ts")) {
    const tsxCli = require.resolve("tsx/cli");
    return {
      command: process.execPath,
      args: [tsxCli, cliEntry, ...workerArgs],
    };
  }

  return {
    command: process.execPath,
    args: [cliEntry, ...workerArgs],
  };
}

export function spawnRenderWorker(
  options: SpawnRenderWorkerOptions
): RenderWorkerHandle {
  const { command, args } = buildSpawnArgs(options);
  const child = spawn(command, args, {
    env: { ...process.env },
    stdio: ["ignore", "inherit", "inherit"],
  });

  let killTimer: ReturnType<typeof setTimeout> | undefined;
  const exitCode = new Promise<number>((resolve) => {
    child.on("exit", (code, signal) => {
      if (killTimer) {
        clearTimeout(killTimer);
      }
      if (code !== null) {
        resolve(code);
        return;
      }
      resolve(signal ? 1 : 0);
    });
  });

  return {
    child,
    exitCode,
    async kill() {
      if (child.killed || child.exitCode !== null) {
        return;
      }
      child.kill("SIGTERM");
      await Promise.race([
        exitCode,
        new Promise<void>((resolve) => {
          killTimer = setTimeout(() => {
            if (!child.killed && child.exitCode === null) {
              child.kill("SIGKILL");
            }
            resolve();
          }, WORKER_KILL_TIMEOUT_MS);
        }),
      ]);
    },
  };
}
