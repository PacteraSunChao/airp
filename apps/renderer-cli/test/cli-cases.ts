import type { CliCase } from "@airp/test-kit";
import { testingRelPath } from "@airp/test-kit";
import packageJson from "../package.json" with { type: "json" };

const e2eOut = (...segments: string[]) =>
  testingRelPath("e2e", "renderer-cli", ...segments);

export const cliCases: CliCase[] = [
  {
    id: "render.usage.version",
    tier: "E2E",
    args: ["--version"],
    exitCode: 0,
    stdoutContains: packageJson.version,
  },
  {
    id: "render.export.html.minimal",
    tier: "E2E",
    document: "valid/minimal.airp.json",
    args: ["export", "--target", "html", "--out", e2eOut("minimal.html")],
    exitCode: 0,
    stdoutContains: "Wrote",
    expectOutFile: true,
  },
  {
    id: "render.export.markdown.minimal",
    tier: "E2E",
    document: "valid/minimal.airp.json",
    args: ["export", "--target", "markdown", "--out", e2eOut("minimal.md")],
    exitCode: 0,
    stdoutContains: "Wrote",
    expectOutFile: true,
  },
  {
    id: "render.export.html.mermaid",
    tier: "E2E",
    document: "valid/mermaid-ok.airp.json",
    args: ["export", "--target", "html", "--out", e2eOut("mermaid.html")],
    exitCode: 0,
    stdoutContains: "Wrote",
    expectOutFile: true,
  },
  {
    id: "render.validate.fail-closed",
    tier: "E2E",
    document: "invalid/missing-meta.airp.json",
    args: ["export", "--target", "html", "--out", e2eOut("fail-closed.html")],
    exitCode: 1,
    stderrContains: "zod-failed",
  },
  {
    id: "render.usage.missing-input",
    tier: "E2E",
    args: ["export", "--target", "html", "--out", e2eOut("missing-input.html")],
    exitCode: 1,
    stderrContains: "Missing required argument: --input",
  },
  {
    id: "render.usage.missing-out",
    tier: "E2E",
    document: "valid/minimal.airp.json",
    args: ["export", "--target", "html"],
    exitCode: 1,
    stderrContains: "Missing required argument: --out",
  },
  {
    id: "render.usage.out-wrong-ext",
    tier: "E2E",
    document: "valid/minimal.airp.json",
    args: ["export", "--target", "html", "--out", e2eOut("wrong.md")],
    exitCode: 1,
    stderrContains: "must end with .html",
  },
  {
    id: "render.usage.out-directory",
    tier: "E2E",
    document: "valid/minimal.airp.json",
    args: ["export", "--target", "html", "--out", e2eOut("outdir")],
    exitCode: 1,
    stderrContains: "must be a single output file",
  },
  {
    id: "render.usage.missing-subcommand",
    tier: "E2E",
    args: ["--input", "x.airp.json"],
    exitCode: 1,
    stderrContains: "Unknown command",
  },
];
