import { readFileSync } from "node:fs";
import path from "node:path";
import { AT_ID_ALPHABET, AT_ID_LENGTH, AT_ID_PATTERN } from "@airp/protocol";
import { resolveRepoRoot } from "@airp/test-kit";
import { describe, expect, it } from "vitest";

/**
 * Drift guard for the machine-handle SSOT.
 *
 * `@airp/protocol` owns the alphabet, length, and pattern, but two other
 * producers still carry their own copy:
 *
 * - `renderer-target-html` matches the handle shape to build section anchors;
 * - the `/airp` Skill script generates handles outside the workspace, so it
 *   cannot import the protocol package.
 *
 * Until those copies converge onto the protocol export, this test fails loudly
 * whenever one of them stops matching — or disappears, which is the signal to
 * retire that entry.
 */
const HARDCODED_PATTERN_SITES = [
  "packages/renderer-target-html/src/emit-handlers.ts",
  "packages/renderer-target-html/src/section-anchor/v1-1-0.ts",
];

const SKILL_ID_GENERATOR =
  ".agents/skills/project/airp/scripts/gen-airp-ids.mjs";

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(resolveRepoRoot(), relativePath), "utf8");
}

describe("machine-handle SSOT", () => {
  it("keeps every hardcoded handle pattern equal to the protocol export", () => {
    const literal = `/${AT_ID_PATTERN.source}/`;

    for (const relativePath of HARDCODED_PATTERN_SITES) {
      expect(readRepoFile(relativePath)).toContain(literal);
    }
  });

  it("keeps the /airp skill generator on the same alphabet and length", () => {
    const source = readRepoFile(SKILL_ID_GENERATOR);

    expect(source).toContain(`const ALPHABET = "${AT_ID_ALPHABET}";`);
    expect(source).toContain(`const ID_LENGTH = ${AT_ID_LENGTH};`);
  });
});
