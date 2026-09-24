import { readFileSync } from "node:fs";
import { documentPath } from "@airp/test-kit";
import { describe, expect, it } from "vitest";
import { serializeDocument } from "../src/index.js";

const FIXTURE = "minimal-1.1.0-zh.airp.json";

function readRaw(): string {
  return readFileSync(documentPath("valid", FIXTURE), "utf8");
}

describe("serializeDocument", () => {
  it("round-trips a fixture byte for byte", () => {
    expect(serializeDocument(JSON.parse(readRaw()))).toBe(readRaw());
  });

  it("ends with exactly one trailing newline", () => {
    expect(serializeDocument({ a: 1 })).toBe('{\n  "a": 1\n}\n');
  });

  it("keeps meta untouched when another field is edited", () => {
    const parsed = JSON.parse(readRaw());
    const edited = JSON.parse(readRaw());
    edited.blocks[0].text = "改写后的正文。";

    const out = JSON.parse(serializeDocument(edited));

    // Whatever the authoring path left in `meta` (including a pre-existing
    // updatedAt) survives an edit unchanged; the editor never stamps a document.
    expect(out.meta).toEqual(parsed.meta);
    expect(out.updatedAt).toBeUndefined();
  });

  it("never adds meta timestamps of its own", () => {
    const document = {
      schemaVersion: "1.1.0",
      meta: {
        title: "Untouched",
        kind: "generic",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      i18n: { locale: "en" },
      blocks: [],
    };

    const out = JSON.parse(serializeDocument(document));

    expect(Object.keys(out.meta)).toEqual(["title", "kind", "createdAt"]);
    expect(out.meta.updatedAt).toBeUndefined();
    expect(out.meta.updatedBy).toBeUndefined();
  });

  it("changes exactly one line for a single-field edit", () => {
    const raw = readRaw();
    const edited = JSON.parse(raw);
    edited.blocks[0].text = "改写后的正文。";

    const before = raw.split("\n");
    const after = serializeDocument(edited).split("\n");

    expect(after).toHaveLength(before.length);
    expect(before.filter((line, i) => line !== after[i])).toHaveLength(1);
  });

  it("preserves document key order", () => {
    const out = JSON.parse(serializeDocument(JSON.parse(readRaw())));

    expect(Object.keys(out)).toEqual([
      "schemaVersion",
      "meta",
      "i18n",
      "blocks",
    ]);
  });

  it("passes unknown fields through untouched", () => {
    const document = {
      schemaVersion: "1.1.0",
      blocks: [],
      futureField: { nested: [1, 2, 3] },
    };

    expect(JSON.parse(serializeDocument(document))).toEqual(document);
  });
});
