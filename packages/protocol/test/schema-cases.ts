import type { SchemaCase } from "@airp/test-kit";

export const schemaCases: SchemaCase[] = [
  {
    id: "schema.document.valid-minimal",
    tier: "Package",
    schemaRef: "document.schema.json",
    document: "valid/minimal.airp.json",
    expect: { ok: true },
  },
  {
    id: "schema.document.valid-richtext-locale-map",
    tier: "Package",
    schemaRef: "document.schema.json",
    document: "valid/richtext-locale-map-1.0.0.airp.json",
    expect: { ok: true },
  },
  {
    id: "schema.document.valid-minimal-1.1.0",
    tier: "Package",
    schemaRef: "document.schema.json",
    document: "valid/minimal-1.1.0.airp.json",
    expect: { ok: true },
  },
  {
    id: "schema.document.missing-meta",
    tier: "Package",
    schemaRef: "document.schema.json",
    document: "invalid/missing-meta.airp.json",
    expect: { ok: false, code: "protocol.schema.get-schema-set.validation" },
  },
  {
    id: "schema.document.bad-schema-version",
    tier: "Package",
    schemaRef: "document.schema.json",
    document: "invalid/bad-schema-version.airp.json",
    expect: { ok: false, code: "protocol.schema.get-schema-set.validation" },
  },
  {
    id: "schema.document.1.1.0-rejects-authors",
    tier: "Package",
    schemaRef: "document.schema.json",
    document: "invalid/authors-on-1.1.0.airp.json",
    expect: { ok: false, code: "protocol.schema.get-schema-set.validation" },
  },
  {
    id: "schema.document.1.1.0-rejects-legacy-i18n",
    tier: "Package",
    schemaRef: "document.schema.json",
    document: "invalid/multi-locale-on-1.1.0.airp.json",
    expect: { ok: false, code: "protocol.schema.get-schema-set.validation" },
  },
  {
    id: "schema.document.1.1.0-rejects-localized-map",
    tier: "Package",
    schemaRef: "document.schema.json",
    document: "invalid/localized-map-on-1.1.0.airp.json",
    expect: { ok: false, code: "protocol.schema.get-schema-set.validation" },
  },
  {
    id: "schema.document.1.1.0-rejects-ui",
    tier: "Package",
    schemaRef: "document.schema.json",
    document: "invalid/ui-on-1.1.0.airp.json",
    expect: { ok: false, code: "protocol.schema.get-schema-set.validation" },
  },
];
