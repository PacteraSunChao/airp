import type { LoadCase } from "@airp/test-kit";

export const loadCases: LoadCase[] = [
  {
    id: "load.document.valid-minimal",
    tier: "Package",
    document: "valid/minimal.airp.json",
    expect: { ok: true, schemaVersion: "1.0.0" },
  },
  {
    id: "load.document.bad-json",
    tier: "Package",
    document: "invalid/bad-json.airp.json",
    expect: { ok: false, code: "loader.load.json-parse" },
  },
  {
    id: "load.document.bad-schema-version",
    tier: "Package",
    document: "invalid/bad-schema-version.airp.json",
    expect: { ok: true, schemaVersion: "9.9.9" },
  },
];
