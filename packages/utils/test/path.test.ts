import { describe, expect, it } from "vitest";
import { posixBasename, toPosixPath } from "../src/path";

describe("toPosixPath", () => {
  it("replaces backslashes with forward slashes", () => {
    expect(toPosixPath("a\\b\\c")).toBe("a/b/c");
  });

  it("leaves forward-slash paths unchanged", () => {
    expect(toPosixPath("a/b/c")).toBe("a/b/c");
  });

  it("strips a leading ./ when requested", () => {
    expect(
      toPosixPath("./docs/a.airp.json", { stripLeadingDotSlash: true })
    ).toBe("docs/a.airp.json");
  });
});

describe("posixBasename", () => {
  it("returns the last path segment", () => {
    expect(
      posixBasename("fixtures/airp/documents/valid/minimal.airp.json")
    ).toBe("minimal.airp.json");
  });

  it("returns the input when there is no slash", () => {
    expect(posixBasename("minimal.airp.json")).toBe("minimal.airp.json");
  });
});
