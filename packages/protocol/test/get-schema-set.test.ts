import { describe, expect, it } from "vitest";
import { PROTOCOL_SCHEMA_TYPES_SCHEMA_VERSION_UNSUPPORTED } from "../src/diagnostic-codes.js";
import {
  assertSchemaVersion,
  getSchemaSet,
  hasSchemaVersion,
  schemaUriBase,
  supportedSchemaVersions,
  toSchemaUri,
} from "../src/index.js";

describe("schema version routing", () => {
  it("registers 1.0.0 and 1.1.0", () => {
    expect(supportedSchemaVersions).toEqual(["1.0.0", "1.1.0"]);
    expect(hasSchemaVersion("1.0.0")).toBe(true);
    expect(hasSchemaVersion("1.1.0")).toBe(true);
    expect(hasSchemaVersion("0.1.0")).toBe(false);
  });

  it("assertSchemaVersion throws with catalog code prefix", () => {
    expect(() => assertSchemaVersion("9.9.9")).toThrow(
      PROTOCOL_SCHEMA_TYPES_SCHEMA_VERSION_UNSUPPORTED.code
    );
  });
});

describe("getSchemaSet", () => {
  it("reuses cached schema set for the same version", () => {
    const first = getSchemaSet("1.0.0");
    const second = getSchemaSet("1.0.0");
    expect(second).toBe(first);
  });

  it("builds airp.local schema URIs", () => {
    expect(schemaUriBase("1.0.0")).toBe("https://airp.local/1.0.0/");
    expect(toSchemaUri("1.0.0", "document.schema.json")).toBe(
      "https://airp.local/1.0.0/document.schema.json"
    );
    expect(schemaUriBase("1.1.0")).toBe("https://airp.local/1.1.0/");
    expect(toSchemaUri("1.1.0", "document.schema.json")).toBe(
      "https://airp.local/1.1.0/document.schema.json"
    );
  });
});
