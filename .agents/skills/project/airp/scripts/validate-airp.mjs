#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";

const input = process.argv[2];

if (!input) {
  console.error(
    "Usage: node scripts/validate-airp.mjs <path/to/file.airp.json>"
  );
  process.exit(1);
}

const resolvedInput = path.resolve(process.cwd(), input);
const cliArgs = ["--input", resolvedInput];

/**
 * @param {string} command
 * @param {string[]} args
 */
function run(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
    env: process.env,
  });
}

let result = run("airp-validate", cliArgs);
if (result.error?.code === "ENOENT") {
  result = run("npx", ["--yes", "@airp/validate-cli", ...cliArgs]);
}

if (result.error) {
  console.error(`Failed to run airp-validate: ${result.error.message}`);
  console.error("Install the CLI: npm i -g @airp/validate-cli");
  console.error(
    "Or ensure npx can fetch @airp/validate-cli from the registry."
  );
  process.exit(2);
}

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

process.exit(result.status ?? 1);
