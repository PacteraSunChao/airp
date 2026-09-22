import type { SpawnSyncReturns } from "node:child_process";
import { spawnSync } from "node:child_process";
import { access, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { documentPath, resolveRepoRoot } from "../paths";
import type { CliCase } from "../types";

export interface CliRunnerOptions {
  cliEntryPath: string;
  cwd?: string;
}

function buildCliArgs(case_: CliCase): string[] {
  const args = [...case_.args];
  if (case_.document === undefined) {
    return args;
  }

  const absolute = documentPath(case_.document);
  const inputFlagIndex = args.indexOf("--input");
  if (inputFlagIndex !== -1) {
    args[inputFlagIndex + 1] = absolute;
    return args;
  }

  args.push("--input", absolute);
  return args;
}

function outPathFromArgs(args: string[]): string | undefined {
  const index = args.indexOf("--out");
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

function assertCliOutput(
  case_: CliCase,
  result: SpawnSyncReturns<string>
): void {
  if (result.status !== case_.exitCode) {
    throw new Error(
      `${case_.id}: exit ${result.status ?? "null"}, expected ${case_.exitCode}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`
    );
  }

  if (
    case_.stdoutContains !== undefined &&
    !result.stdout.includes(case_.stdoutContains)
  ) {
    throw new Error(`${case_.id}: stdout missing "${case_.stdoutContains}"`);
  }

  if (case_.stdoutJson !== undefined) {
    const report = JSON.parse(result.stdout);
    if (report.ok !== case_.stdoutJson.ok) {
      throw new Error(`${case_.id}: report.ok ${report.ok}`);
    }
    if (case_.bootstrapCode !== undefined) {
      const hasCode = report.diagnostics?.some(
        (diagnostic: { code: string; stage?: string }) =>
          diagnostic.stage === "bootstrap" &&
          diagnostic.code === case_.bootstrapCode
      );
      if (!hasCode) {
        throw new Error(`${case_.id}: missing bootstrap code`);
      }
    }
  }

  if (case_.stdoutEmpty && result.stdout.trim() !== "") {
    throw new Error(`${case_.id}: expected empty stdout`);
  }

  if (
    case_.stderrContains !== undefined &&
    !result.stderr.includes(case_.stderrContains)
  ) {
    throw new Error(
      `${case_.id}: stderr missing "${case_.stderrContains}"\nstderr: ${result.stderr}`
    );
  }
}

async function assertOutFile(case_: CliCase, args: string[]): Promise<void> {
  if (!case_.expectOutFile) {
    return;
  }
  const outRel = outPathFromArgs(args);
  if (!outRel) {
    throw new Error(`${case_.id}: expectOutFile but no --out`);
  }
  const absolute = path.resolve(resolveRepoRoot(), outRel);
  await access(absolute);
  const fileStat = await stat(absolute);
  if (!fileStat.isFile() || fileStat.size === 0) {
    throw new Error(`${case_.id}: out file missing or empty: ${absolute}`);
  }
}

/** E2E: spawn a CLI entry with fixture document paths. */
export async function runCliCase(
  case_: CliCase,
  options: CliRunnerOptions
): Promise<void> {
  const require = createRequire(import.meta.url);
  const tsxCli = require.resolve("tsx/cli");
  const cwd = options.cwd ?? resolveRepoRoot();
  const args = buildCliArgs(case_);

  const result = spawnSync(
    process.execPath,
    [tsxCli, options.cliEntryPath, ...args],
    {
      cwd,
      encoding: "utf8",
      env: (() => {
        const { FORCE_COLOR: _omitForceColor, ...env } = process.env;
        return env;
      })(),
    }
  );

  assertCliOutput(case_, result);
  await assertOutFile(case_, args);
}

export function defaultValidateCliPath(): string {
  return path.join(resolveRepoRoot(), "apps", "validate-cli", "src", "cli.ts");
}

export function defaultRenderCliPath(): string {
  return path.join(resolveRepoRoot(), "apps", "renderer-cli", "src", "cli.ts");
}
