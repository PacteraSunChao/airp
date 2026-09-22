#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findWorkspaceRoot } from "@airp/utils/node";

const require = createRequire(import.meta.url);
const tsxCli = require.resolve("tsx/cli");
const packageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const cliPath = path.join(packageDir, "src", "cli.ts");
const cwd = findWorkspaceRoot(packageDir);

const userArgs = process.argv.slice(2).filter((arg) => arg !== "--");

const result = spawnSync(process.execPath, [tsxCli, cliPath, ...userArgs], {
  cwd,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
