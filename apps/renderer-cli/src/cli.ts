import { defineCommand, runMain } from "citty";
import packageJson from "../package.json" with { type: "json" };
import { exportCommand } from "./commands/export.js";
import { watchCommand } from "./commands/watch.js";
import { workerCommand } from "./commands/worker.js";

const command = defineCommand({
  meta: {
    name: "airp-render",
    version: packageJson.version,
    description: "Render AIRP documents to HTML or Markdown",
  },
  subCommands: {
    export: exportCommand,
    watch: watchCommand,
    worker: workerCommand,
  },
});

await runMain(command);
