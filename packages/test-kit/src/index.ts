// biome-ignore lint/performance/noBarrelFile: package public API entry point
export {
  assertDiagnosticCodeCoverage,
  assertDiagnosticsMatchCatalog,
  type DiagnosticCodeCaseSources,
  type DiagnosticSeverityCatalogEntry,
} from "./diagnostic-code-coverage";
export {
  airpFixturesRoot,
  documentPath,
  fixturePath,
  mkdtempSyncTestingUnit,
  mkdtempTestingUnit,
  resolveRepoRoot,
  resolveTestingPath,
  resolveTmpRoot,
  testingRelPath,
} from "./paths";
export {
  type CliRunnerOptions,
  defaultRenderCliPath,
  defaultValidateCliPath,
  runCliCase,
} from "./runners/cli";
export { assertSchemaCoverage } from "./schema-coverage";
export type {
  CaseRegistryEntry,
  PackageTestSurface,
  TestTier,
} from "./testing-surface";
export type {
  CliCase,
  LoadCase,
  PipelineCase,
  SchemaCase,
  TestTier as CaseTestTier,
} from "./types";
