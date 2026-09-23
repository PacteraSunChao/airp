import type { PipelineCase } from "@airp/test-kit";

export const pipelineCases: PipelineCase[] = [
  {
    id: "pipeline.document.valid-minimal",
    tier: "Package",
    document: "valid/minimal.airp.json",
    mode: "node",
    expect: { ok: true },
  },
  {
    id: "pipeline.document.valid-richtext-locale-map",
    tier: "Package",
    document: "valid/richtext-locale-map-1.0.0.airp.json",
    mode: "node",
    expect: { ok: true },
  },
  {
    id: "pipeline.document.valid-minimal-1.1.0",
    tier: "Package",
    document: "valid/minimal-1.1.0.airp.json",
    mode: "node",
    expect: { ok: true },
  },
  {
    id: "pipeline.document.valid-mermaid",
    tier: "Package",
    document: "valid/mermaid-ok.airp.json",
    mode: "node",
    expect: { ok: true },
  },
  {
    id: "pipeline.document.1.1.0-rejects-authors",
    tier: "Package",
    document: "invalid/authors-on-1.1.0.airp.json",
    mode: "iso",
    expect: {
      ok: false,
      failedStage: "document",
      codes: ["protocol.schema.get-schema-set.validation"],
    },
  },
  {
    id: "pipeline.document.1.1.0-rejects-legacy-i18n",
    tier: "Package",
    document: "invalid/multi-locale-on-1.1.0.airp.json",
    mode: "iso",
    expect: {
      ok: false,
      failedStage: "document",
      codes: ["protocol.schema.get-schema-set.validation"],
    },
  },
  {
    id: "pipeline.document.missing-meta",
    tier: "Package",
    document: "invalid/missing-meta.airp.json",
    mode: "iso",
    expect: {
      ok: false,
      failedStage: "document",
      codes: ["protocol.schema.get-schema-set.validation"],
    },
  },
  {
    id: "pipeline.schema-version.unsupported",
    tier: "Package",
    document: "invalid/bad-schema-version.airp.json",
    mode: "iso",
    expect: {
      ok: false,
      failedStage: "schema-version",
      codes: ["validate.schema-version.unsupported"],
    },
  },
  {
    id: "pipeline.i18n.default-locale-missing",
    tier: "Package",
    document: "invalid/i18n-default-locale-missing.airp.json",
    mode: "iso",
    expect: {
      ok: false,
      failedStage: "i18n",
      codes: ["validate.validators.i18n.default-locale-missing"],
    },
  },
  {
    id: "pipeline.i18n.localized-missing-default",
    tier: "Package",
    document: "invalid/i18n-localized-missing-default.airp.json",
    mode: "iso",
    expect: {
      ok: false,
      failedStage: "i18n",
      codes: ["validate.validators.i18n.localized-string-missing-default"],
    },
  },
  {
    id: "pipeline.block-id.duplicate",
    tier: "Package",
    document: "invalid/duplicate-block-id.airp.json",
    mode: "iso",
    expect: {
      ok: false,
      failedStage: "block-id",
      codes: ["validate.validators.block-id.duplicate"],
    },
  },
  {
    id: "pipeline.at-id.duplicate-1.1.0",
    tier: "Package",
    document: "invalid/duplicate-at-id-1.1.0.airp.json",
    mode: "iso",
    expect: {
      ok: false,
      failedStage: "at-id",
      codes: ["validate.validators.at-id.duplicate"],
    },
  },
  {
    id: "pipeline.at-id.missing-1.1.0",
    tier: "Package",
    document: "invalid/missing-at-id-1.1.0.airp.json",
    mode: "iso",
    expect: {
      ok: false,
      failedStage: "document",
      codes: ["protocol.schema.get-schema-set.validation"],
    },
  },
  {
    id: "pipeline.at-id.invalid-pattern-1.1.0",
    tier: "Package",
    document: "invalid/invalid-at-id-pattern-1.1.0.airp.json",
    mode: "iso",
    expect: {
      ok: false,
      failedStage: "document",
      codes: ["protocol.schema.get-schema-set.validation"],
    },
  },
  {
    id: "pipeline.mermaid.parse-fail",
    tier: "Package",
    document: "invalid/mermaid-parse-fail.airp.json",
    mode: "node",
    expect: {
      ok: false,
      failedStage: "mermaid-parse",
      codes: ["validate.validators.mermaid-parse.failed"],
    },
  },
];
