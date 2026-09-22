import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import type { EmitContext } from "../src/emit-helpers.js";
import { formatRichHtml } from "../src/emit-helpers.js";

const HEADING_TAG = /<h[1-6]\b/;
const UL_TAG = /<ul\b/;

function ctx110(): EmitContext {
  return { schemaVersion: "1.1.0" } as EmitContext;
}

function parseFragment(html: string): Document {
  return new JSDOM(`<!doctype html><body>${html}</body>`).window.document;
}

describe("formatRichHtml markdown-lite", () => {
  it("renders bold, italic, strike, code, and links with design tokens", () => {
    const html = formatRichHtml(
      ctx110(),
      "See **bold**, *italic*, ~~strike~~, `code`, and [docs](https://example.com)."
    );
    const doc = parseFragment(html);

    const strong = doc.querySelector("strong");
    expect(strong?.textContent).toBe("bold");
    expect(strong?.getAttribute("style") ?? "").toContain("var(--text-main)");

    const em = doc.querySelector("em");
    expect(em?.textContent).toBe("italic");

    const del = doc.querySelector("del");
    expect(del?.textContent).toBe("strike");
    expect(del?.getAttribute("style") ?? "").toContain("var(--text-muted)");

    const code = doc.querySelector("code");
    expect(code?.textContent).toBe("code");
    expect(code?.getAttribute("style") ?? "").toContain("var(--code-bg)");
    expect(code?.getAttribute("style") ?? "").toContain("var(--code-border)");

    const link = doc.querySelector("a");
    expect(link?.textContent).toBe("docs");
    expect(link?.getAttribute("href")).toBe("https://example.com");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("leaves block-level markdown as literal text", () => {
    const html = formatRichHtml(ctx110(), "# Heading\n- item");
    expect(html).toContain("# Heading");
    expect(html).toContain("- item");
    expect(html).not.toMatch(HEADING_TAG);
    expect(html).not.toMatch(UL_TAG);
  });

  it("escapes HTML before applying markdown-lite", () => {
    const html = formatRichHtml(ctx110(), "<script>alert(1)</script> **ok**");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(parseFragment(html).querySelector("strong")?.textContent).toBe("ok");
  });

  it("styles 1.0.0 InlineNode code with the same tokens", () => {
    const html = formatRichHtml({ schemaVersion: "1.0.0" } as EmitContext, [
      { type: "code", value: "token" },
    ]);
    const code = parseFragment(html).querySelector("code");
    expect(code?.textContent).toBe("token");
    expect(code?.getAttribute("style") ?? "").toContain("var(--code-bg)");
  });
});
