#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import packageJson from "../package.json" with { type: "json" };
import { runValidate } from "./run-validate.js";

const command = defineCommand({
  meta: {
    name: "airp-validate",
    version: packageJson.version,
    description: "Validate an AIRP document (*.airp.json)",
  },
  args: {
    input: {
      type: "string",
      description: "Path to a *.airp.json document",
      required: true,
    },
    reporter: {
      type: "enum",
      options: ["text", "json"],
      default: "text",
      description: "Report output style (text or json)",
    },
  },
  async run({ args }) {
    const code = await runValidate({
      input: args.input as string,
      reporter: args.reporter as "text" | "json",
    });
    process.exit(code);
  },
});

await runMain(command);
