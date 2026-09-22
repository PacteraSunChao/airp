export type TestTier = "Unit" | "Package" | "E2E";

export interface BaseCase {
  id: string;
  tier: TestTier;
}

export type SchemaCase = BaseCase & {
  tier: "Package";
  schemaRef: string;
  document: string;
  expect: { ok: true } | { ok: false; code: string };
};

export type LoadCase = BaseCase & {
  tier: "Package";
  document: string;
  expect: { ok: true; schemaVersion: string } | { ok: false; code: string };
};

export type PipelineCase = BaseCase & {
  tier: "Package";
  document: string;
  mode: "iso" | "node";
  expect: { ok: true } | { ok: false; failedStage: string; codes: string[] };
};

export type CliCase = BaseCase & {
  tier: "E2E";
  document?: string;
  args: string[];
  exitCode: number;
  stdoutContains?: string;
  stdoutEmpty?: boolean;
  stdoutJson?: { ok: boolean };
  bootstrapCode?: string;
  stderrContains?: string;
  /** When set, assert the written `--out` file exists and is non-empty. */
  expectOutFile?: boolean;
};

export type AnyCase = SchemaCase | LoadCase | PipelineCase | CliCase;
