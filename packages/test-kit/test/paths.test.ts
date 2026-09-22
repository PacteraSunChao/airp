import { describe, expect, it } from "vitest";
import {
  airpFixturesRoot,
  documentPath,
  resolveTestingPath,
  resolveTmpRoot,
  testingRelPath,
} from "../src/paths.js";

const FIXTURES_ROOT = /fixtures\/airp$/;
const MINIMAL_DOC = /fixtures\/airp\/documents\/valid\/minimal\.airp\.json$/;
const TMP_ROOT = /\.tmp$/;
const TESTING_UNIT_RENDER_CLI =
  /\.tmp[/\\]testing[/\\]unit[/\\]airp-renderer-cli$/;

describe("fixture paths", () => {
  it("resolves fixtures under fixtures/airp", () => {
    expect(airpFixturesRoot()).toMatch(FIXTURES_ROOT);
    expect(documentPath("valid", "minimal.airp.json")).toMatch(MINIMAL_DOC);
    expect(documentPath("valid/minimal.airp.json")).toMatch(MINIMAL_DOC);
  });
});

describe("tmp testing paths", () => {
  it("resolves under repo .tmp/testing", () => {
    expect(resolveTmpRoot()).toMatch(TMP_ROOT);
    expect(resolveTestingPath("unit", "airp-renderer-cli")).toMatch(
      TESTING_UNIT_RENDER_CLI
    );
    expect(testingRelPath("e2e", "renderer-cli", "minimal.html")).toBe(
      ".tmp/testing/e2e/renderer-cli/minimal.html"
    );
  });
});
