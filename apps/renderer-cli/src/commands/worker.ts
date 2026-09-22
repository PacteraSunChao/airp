import { logDiagnostics } from "@airp/diagnostics";
import { createCliLogger, UsageError } from "@airp/utils/node";
import { defineCommand } from "citty";
import type { RendererCliScene } from "../command-types.js";
import { exitCaughtError } from "../exit-caught-error.js";
import { resolveOutFileNotEqualInput } from "../out/resolve-out-file.js";
import { runRenderPipeline } from "../worker/run-render-pipeline.js";
import {
  commonRenderArgs,
  readCommonRenderArgs,
  readOptionalOut,
} from "./shared-args.js";

/** Internal Worker: render into `--out` and exit. */
export const workerCommand = defineCommand({
  meta: {
    name: "worker",
    description: "Internal render worker (write output file and exit)",
  },
  args: {
    ...commonRenderArgs,
    out: {
      type: "string",
      required: true,
      description: "Absolute output file path (staging or user --out)",
    },
    scene: {
      type: "enum",
      options: ["export", "watch"],
      default: "export",
      description: "Host scene (export | watch)",
    },
  },
  async run({ args }) {
    const record = args as Record<string, unknown>;
    const log = createCliLogger();
    try {
      const common = readCommonRenderArgs(record);
      const out = readOptionalOut(record);
      if (!out) {
        throw new UsageError("Missing required argument: --out");
      }
      const outFile = resolveOutFileNotEqualInput(
        out,
        common.input,
        common.target
      );
      const scene = (record.scene ?? "export") as RendererCliScene;
      const result = await runRenderPipeline({
        ...common,
        outFile,
        scene,
      });
      if (!result.ok) {
        logDiagnostics(log, result.diagnostics);
        process.exit(1);
      }
      logDiagnostics(log, result.diagnostics);
      process.exit(0);
    } catch (error) {
      exitCaughtError(log, error);
    }
  },
});
