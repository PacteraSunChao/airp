import type { CliCase } from "@airp/test-kit";
import packageJson from "../package.json" with { type: "json" };

export const cliCases: CliCase[] = [
  {
    id: "cli.usage.version",
    tier: "E2E",
    args: ["--version"],
    exitCode: 0,
    stdoutContains: packageJson.version,
  },
  {
    id: "cli.minimal.success",
    tier: "E2E",
    document: "valid/minimal.airp.json",
    args: [],
    exitCode: 0,
    stdoutContains: "OK  validate",
  },
  {
    id: "cli.minimal.json",
    tier: "E2E",
    document: "valid/minimal.airp.json",
    args: ["--reporter", "json"],
    exitCode: 0,
    stdoutJson: { ok: true },
  },
  {
    id: "cli.mermaid.ok",
    tier: "E2E",
    document: "valid/mermaid-ok.airp.json",
    args: [],
    exitCode: 0,
    stdoutContains: "OK  validate",
  },
  {
    id: "cli.document.missing-meta",
    tier: "E2E",
    document: "invalid/missing-meta.airp.json",
    args: ["--reporter", "json"],
    exitCode: 1,
    stdoutJson: { ok: false },
  },
  {
    id: "cli.missing-path",
    tier: "E2E",
    args: ["--reporter", "json", "--input", "does-not-exist.airp.json"],
    exitCode: 1,
    stdoutJson: { ok: false },
    bootstrapCode: "loader.node.input-unavailable",
  },
  {
    id: "cli.usage.missing-input",
    tier: "E2E",
    args: [],
    exitCode: 1,
    stderrContains: "Missing required argument: --input",
  },
  {
    id: "cli.usage.unknown-reporter",
    tier: "E2E",
    document: "valid/minimal.airp.json",
    args: ["--reporter", "yaml"],
    exitCode: 1,
    stderrContains: "Invalid value for argument: --reporter",
  },
];
