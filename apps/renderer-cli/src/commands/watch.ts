import { createCliLogger } from "@airp/utils/node";
import { defineCommand } from "citty";
import { exitCaughtError } from "../exit-caught-error.js";
import { runSupervisor } from "../supervisor/run-supervisor.js";
import { validateWatchModes } from "../supervisor/watch-validation.js";
import {
  commonRenderArgs,
  readCommonRenderArgs,
  readOptionalOut,
} from "./shared-args.js";

export const watchCommand = defineCommand({
  meta: {
    name: "watch",
    description: "Watch an AIRP document and re-render on changes",
  },
  args: {
    ...commonRenderArgs,
    out: {
      type: "string",
      description: "Output file (.html or .md)",
      required: false,
    },
    serve: {
      type: "boolean",
      description: "Enable HTML HTTP serve (target=html only)",
      default: false,
    },
    "serve-port": {
      type: "string",
      description: "HTTP port when --serve (default: 4173)",
      default: "4173",
    },
  },
  async run({ args }) {
    const record = args as Record<string, unknown>;
    const log = createCliLogger();
    try {
      const common = readCommonRenderArgs(record);
      const out = readOptionalOut(record) ?? null;
      const explicitServe = args.serve === true;
      const servePort = Number(
        record["serve-port"] ?? record.servePort ?? "4173"
      );

      validateWatchModes({
        explicitServe,
        target: common.target,
        out,
        servePort,
      });

      await runSupervisor({
        ...common,
        out,
        serve: {
          enabled: common.target === "html" && explicitServe,
          port: servePort,
          liveReload: true,
        },
        log,
      });
    } catch (error) {
      exitCaughtError(log, error);
    }
  },
});
