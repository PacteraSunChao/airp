import path from "node:path";
import { logDiagnostics, logInternalError } from "@airp/diagnostics";
import type { RenderTarget } from "@airp/renderer";
import type { Logger } from "@airp/utils";
import type { WatchServeConfig } from "../command-types.js";
import {
  defaultPrimaryFilename,
  resolveOutFileNotEqualInput,
} from "../out/resolve-out-file.js";
import { rendererDistDirForWatch } from "../renderer/load-render-document.js";
import { createStagingSession } from "../staging/staging-paths.js";
import { HtmlWatchServeHost } from "../watch-serve/html-watch-serve-host.js";
import { runRenderPipeline } from "../worker/run-render-pipeline.js";
import { ChangeWatcher, formatWatchLogLine } from "./change-watcher.js";
import { deliverWatchHtml } from "./deliver-watch-html.js";
import {
  type RenderWorkerHandle,
  spawnRenderWorker,
} from "./worker-process.js";

export interface RunSupervisorOptions {
  input: string;
  log: Logger;
  out: string | null;
  serve: WatchServeConfig;
  target: RenderTarget;
}

export async function runSupervisor(
  options: RunSupervisorOptions
): Promise<void> {
  const inputFile = path.resolve(options.input);
  const outFile = options.out
    ? resolveOutFileNotEqualInput(options.out, inputFile, options.target)
    : null;
  const session = await createStagingSession(process.cwd());

  const primaryPath =
    outFile ??
    path.join(session.runStagingDir, defaultPrimaryFilename(options.target));
  const scene = outFile ? "export" : "watch";

  let serveHost: HtmlWatchServeHost | undefined;
  if (options.serve.enabled) {
    serveHost = new HtmlWatchServeHost({
      port: options.serve.port,
      onError: (message) => {
        options.log.error(message);
      },
    });
  }

  let activeWorker: RenderWorkerHandle | undefined;
  let shuttingDown = false;
  let writtenPath: string | null = outFile;
  let watcher: ChangeWatcher | undefined;
  let renderQueue: Promise<void> = Promise.resolve();

  const deliverAfterReady = async (): Promise<void> => {
    await deliverWatchHtml({
      primaryPath,
      onReadError: (message) => {
        options.log.error(message);
      },
      onWatchHtml:
        serveHost && options.target === "html"
          ? (body) => {
              if (typeof body === "string") {
                serveHost?.setStagingHtml(body);
              }
            }
          : undefined,
    });
    if (outFile) {
      writtenPath = outFile;
    }
  };

  const runWorkerOnce = async (): Promise<void> => {
    if (shuttingDown) {
      return;
    }
    try {
      if (activeWorker) {
        await activeWorker.kill();
        activeWorker = undefined;
      }

      const worker = spawnRenderWorker({
        input: inputFile,
        target: options.target,
        outFile: primaryPath,
        scene,
      });
      activeWorker = worker;
      const code = await worker.exitCode;
      activeWorker = undefined;

      if (code !== 0) {
        serveHost?.reportRenderError(`Render worker exited with code ${code}`);
        return;
      }

      await deliverAfterReady();
      options.log.info("Rendered");
    } catch (error) {
      const message = (error as Error).message;
      serveHost?.reportRenderError(message);
      logInternalError(options.log, error);
    }
  };

  const enqueueRender = (): void => {
    renderQueue = renderQueue
      .then(() => runWorkerOnce())
      .catch((error) => {
        logInternalError(options.log, error);
      });
  };

  enqueueRender();
  await renderQueue;

  let serveUrl: string | null = null;
  if (serveHost) {
    serveUrl = await serveHost.start();
  }

  options.log.info(
    formatWatchingMessage(inputFile, writtenPath ?? options.out, serveUrl)
  );

  const killActiveWorker = (): void => {
    if (!activeWorker) {
      return;
    }
    const worker = activeWorker;
    activeWorker = undefined;
    worker.kill().catch((error) => {
      logInternalError(options.log, error);
    });
  };

  watcher = new ChangeWatcher({
    inputFile,
    rendererDistDir: rendererDistDirForWatch(),
    onInterrupt: () => {
      killActiveWorker();
    },
    onChange: (changes) => {
      options.log.info(formatWatchLogLine(changes));
      enqueueRender();
    },
  });
  await watcher.start();

  const shutdown = async (): Promise<void> => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    await watcher?.stop();
    if (activeWorker) {
      await activeWorker.kill();
    }
    await serveHost?.close();
    const { rm } = await import("node:fs/promises");
    await rm(session.runStagingDir, { force: true, recursive: true }).catch(
      () => {
        // Best-effort cleanup.
      }
    );
  };

  process.once("SIGINT", () => {
    shutdown()
      .then(() => {
        process.exit(0);
      })
      .catch(() => {
        process.exit(1);
      });
  });
  process.once("SIGTERM", () => {
    shutdown()
      .then(() => {
        process.exit(0);
      })
      .catch(() => {
        process.exit(1);
      });
  });

  await new Promise<void>(() => {
    // Keep process alive until interrupted.
  });
}

function formatWatchingMessage(
  inputFile: string,
  out: string | null,
  serveUrl: string | null
): string {
  const input = path.relative(process.cwd(), inputFile) || inputFile;
  if (serveUrl && out) {
    const outPath = path.isAbsolute(out) ? out : path.resolve(out);
    return `Watching ${input} · serve ${serveUrl} → ${outPath}`;
  }
  if (serveUrl) {
    return `Watching ${input} · serve ${serveUrl}`;
  }
  if (out) {
    const outPath = path.isAbsolute(out) ? out : path.resolve(out);
    return `Watching ${input} → ${outPath}`;
  }
  return `Watching ${input}`;
}

/** One-shot export: render into `--out` file. */
export async function runExportOnce(options: {
  input: string;
  log: Logger;
  out: string;
  target: RenderTarget;
}): Promise<{ ok: true; filename: string; written: string } | { ok: false }> {
  const { input, out, target } = options;
  const outFile = resolveOutFileNotEqualInput(out, input, target);
  const rendered = await runRenderPipeline({
    input,
    target,
    outFile,
    scene: "export",
  });
  if (!rendered.ok) {
    logDiagnostics(options.log, rendered.diagnostics);
    return { ok: false };
  }
  logDiagnostics(options.log, rendered.diagnostics);
  return {
    ok: true,
    filename: rendered.value.primaryFilename,
    written: rendered.value.primaryPath,
  };
}

export function formatExportMessage(result: {
  filename: string;
  written: string;
}): string {
  return `Wrote ${result.filename} to ${result.written}`;
}
