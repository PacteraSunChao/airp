import { createCliLogger } from "@airp/utils/node";
import { defineCommand } from "citty";
import { exitCaughtError } from "../exit-caught-error.js";
import {
  formatExportMessage,
  runExportOnce,
} from "../supervisor/run-supervisor.js";
import { commonRenderArgs, readCommonRenderArgs } from "./shared-args.js";

export const exportCommand = defineCommand({
  meta: {
    name: "export",
    description: "Export a rendered artifact once",
  },
  args: {
    ...commonRenderArgs,
    out: {
      type: "string",
      description: "Output file (.html or .md)",
      required: true,
    },
  },
  async run({ args }) {
    const record = args as Record<string, unknown>;
    const log = createCliLogger();
    try {
      const common = readCommonRenderArgs(record);
      const result = await runExportOnce({
        ...common,
        out: args.out as string,
        log,
      });
      if (!result.ok) {
        process.exit(1);
      }
      log.info(formatExportMessage(result));
      process.exit(0);
    } catch (error) {
      exitCaughtError(log, error);
    }
  },
});
