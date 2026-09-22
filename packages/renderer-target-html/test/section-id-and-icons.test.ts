import { AirpDiagnosticError } from "@airp/diagnostics";
import { describe, expect, it } from "vitest";
import type { EmitContext } from "../src/emit-helpers.js";
import { renderIcon, renderIconSprite } from "../src/icons/render-icon.js";
import { allocateSectionId } from "../src/section-anchor/v1-0-0.js";
import { sectionAnchor110 } from "../src/section-anchor/v1-1-0.js";

const SECTION_FALLBACK_ID = /^section-\d+$/;

function sectionIdCtx(): Pick<EmitContext, "sectionIds"> {
  return { sectionIds: new Set() };
}

describe("allocateSectionId", () => {
  it("uses explicit protocol ids", () => {
    const ctx = sectionIdCtx() as EmitContext;
    expect(allocateSectionId(ctx, "block-mermaid", "Mermaid")).toBe(
      "block-mermaid"
    );
  });

  it("slugs ascii titles and dedupes", () => {
    const ctx = sectionIdCtx() as EmitContext;
    expect(allocateSectionId(ctx, undefined, "Hello World")).toBe(
      "hello-world"
    );
    expect(allocateSectionId(ctx, undefined, "Hello World")).toBe(
      "hello-world-2"
    );
  });

  it("falls back for non-ascii titles", () => {
    const ctx = sectionIdCtx() as EmitContext;
    expect(allocateSectionId(ctx, undefined, "阶段样例")).toMatch(
      SECTION_FALLBACK_ID
    );
  });
});

describe("sectionAnchor110", () => {
  it("uses @id as the HTML id", () => {
    const ctx = sectionIdCtx();
    expect(
      sectionAnchor110(ctx, { "@id": "abcdefghij", type: "section" }, "Title")
    ).toBe("abcdefghij");
  });

  it("hard-fails when @id is missing", () => {
    const ctx = sectionIdCtx();
    expect(() => sectionAnchor110(ctx, { type: "section" }, "Title")).toThrow(
      AirpDiagnosticError
    );
  });
});

describe("renderIcon", () => {
  it("references sprite symbols", () => {
    const icon = renderIcon("sun", { className: "size-4" });
    expect(icon).toContain('href="#airp-icon-sun"');
    expect(icon).toContain('class="size-4"');
    expect(renderIconSprite()).toContain('id="airp-icon-sun"');
    expect(renderIconSprite()).toContain('id="airp-icon-book-open"');
    expect(renderIconSprite()).toContain('id="airp-icon-layers"');
    expect(renderIconSprite()).toContain('id="airp-icon-github"');
    expect(renderIconSprite()).toContain('id="airp-icon-copy"');
    expect(renderIconSprite()).toContain('id="airp-icon-info"');
    expect(renderIconSprite()).toContain('id="airp-icon-shield-alert"');
    expect(renderIconSprite()).toContain('id="airp-icon-chevron-down"');
  });
});
