import { readFileSync } from "node:fs";
import type { AirpDiagnostic } from "@airp/diagnostics";
import { documentPath } from "@airp/test-kit";
import { validateDocument } from "@airp/validate";
import { describe, expect, it } from "vitest";
import { resolveDiagnosticLocations, toJsonPointer } from "../src/index.js";

const FIXTURE = "section-at-id-1.1.0.airp.json";

function readDocument(relPath = `valid/${FIXTURE}`): unknown {
  return JSON.parse(readFileSync(documentPath(relPath), "utf8"));
}

function diagnosticAt(path: string | undefined): AirpDiagnostic {
  return {
    code: "test.code",
    message: "something is off",
    severity: "error",
    ...(path === undefined ? {} : { location: { path } }),
  };
}

describe("resolveDiagnosticLocations", () => {
  it("badges the nearest node carrying a handle", () => {
    const document = readDocument();

    expect(
      resolveDiagnosticLocations(
        [diagnosticAt("/blocks/0/children/0/text")],
        document
      )
    ).toEqual([
      {
        atId: "bbbbbbbbbb",
        diagnostic: diagnosticAt("/blocks/0/children/0/text"),
        nodePath: ["blocks", 0, "children", 0],
        path: ["blocks", 0, "children", 0, "text"],
      },
    ]);
  });

  it("badges the node itself when the diagnostic points at it", () => {
    const document = readDocument();
    const [location] = resolveDiagnosticLocations(
      [diagnosticAt("/blocks/1")],
      document
    );

    expect(location?.atId).toBe("eeeeeeeeee");
    expect(location?.nodePath).toEqual(["blocks", 1]);
  });

  it("badges the structured object a handle complaint belongs to", () => {
    const document = readDocument();
    const [location] = resolveDiagnosticLocations(
      [diagnosticAt("/blocks/1/items/1/@id")],
      document
    );

    expect(location?.atId).toBe("gggggggggg");
    expect(location?.nodePath).toEqual(["blocks", 1, "items", 1]);
  });

  it("falls back to the diagnostic path when no ancestor has a handle", () => {
    const [location] = resolveDiagnosticLocations(
      [diagnosticAt("/meta/title")],
      { meta: { title: "" } }
    );

    expect(location?.atId).toBeUndefined();
    expect(location?.nodePath).toEqual(["meta", "title"]);
  });

  it("keeps the root for a diagnostic without a location", () => {
    const [location] = resolveDiagnosticLocations(
      [diagnosticAt(undefined)],
      readDocument()
    );

    expect(location?.path).toBeUndefined();
    expect(location?.nodePath).toEqual([]);
    expect(location?.atId).toBeUndefined();
  });

  it('keeps the root for a "/" location', () => {
    const [location] = resolveDiagnosticLocations(
      [diagnosticAt("/")],
      readDocument()
    );

    expect(location?.path).toEqual([]);
    expect(location?.nodePath).toEqual([]);
  });

  it("keeps the diagnostics and their order", () => {
    const document = readDocument();
    const first = diagnosticAt("/blocks/0/title");
    const second = diagnosticAt(undefined);
    const locations = resolveDiagnosticLocations([first, second], document);

    expect(locations).toHaveLength(2);
    expect(locations[0]?.diagnostic).toBe(first);
    expect(locations[1]?.diagnostic).toBe(second);
  });

  it("resolves a path the document does not contain", () => {
    const [location] = resolveDiagnosticLocations(
      [diagnosticAt("/blocks/9/text")],
      readDocument()
    );

    expect(location?.atId).toBeUndefined();
    expect(location?.nodePath).toEqual(["blocks", 9, "text"]);
  });
});

describe("with @airp/validate output", () => {
  const fixtures = [
    "missing-at-id-1.1.0.airp.json",
    "invalid-at-id-pattern-1.1.0.airp.json",
    "duplicate-at-id-1.1.0.airp.json",
    "missing-meta.airp.json",
  ];

  it("locates every diagnostic of every invalid fixture", async () => {
    for (const fixture of fixtures) {
      const document = readDocument(`invalid/${fixture}`);
      const result = await validateDocument(document);

      expect(result.ok).toBe(false);
      expect(result.diagnostics.length).toBeGreaterThan(0);

      const locations = resolveDiagnosticLocations(
        result.diagnostics,
        document
      );
      expect(locations).toHaveLength(result.diagnostics.length);
      for (const location of locations) {
        expect(Array.isArray(location.nodePath)).toBe(true);
      }
    }
  });

  it("points a missing handle at the block that lacks it", async () => {
    const document = readDocument("invalid/missing-at-id-1.1.0.airp.json");
    const result = await validateDocument(document);
    const locations = resolveDiagnosticLocations(result.diagnostics, document);
    const block = locations.find(
      (location) => toJsonPointer(location.nodePath) === "/blocks/0"
    );

    expect(block).toBeDefined();
    expect(block?.atId).toBeUndefined();
  });

  it("reports the handle a duplicate complaint is about", async () => {
    const document = readDocument("invalid/duplicate-at-id-1.1.0.airp.json");
    const result = await validateDocument(document);
    const locations = resolveDiagnosticLocations(result.diagnostics, document);
    const duplicate = locations.find((location) => location.atId !== undefined);

    expect(duplicate?.atId).toBe("abcdefghij");
  });
});
