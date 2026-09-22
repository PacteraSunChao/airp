import { fork } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const workerPath = path.join(packageDir, "dist", "render-worker.cjs");

describe("airp-renderer-vscode unit render worker boot", () => {
  it("starts without crashing on jsdom load", async () => {
    const child = fork(workerPath, [], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    });

    const stderrChunks: Buffer[] = [];
    child.stderr?.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve();
        }, 500);
        child.once("exit", (code, signal) => {
          clearTimeout(timer);
          reject(
            new Error(
              `worker exited early code=${code} signal=${signal}\n${Buffer.concat(stderrChunks).toString("utf8")}`
            )
          );
        });
        child.once("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
      });
    } finally {
      child.kill("SIGTERM");
    }

    expect(child.exitCode).toBeNull();
  });
});
