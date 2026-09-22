import type { AirpDocumentSnapshot } from "@airp/renderer-contract";
import { documentRenderLocale } from "@airp/renderer-shared";
import { describe, expect, it } from "vitest";
import { RENDERER_PIPELINE_LOCALE_UNRESOLVED } from "../src/diagnostic-codes.js";
import { resolveRenderLocales } from "../src/pipeline/resolve-locales.js";

const stubModule = {
  target: "markdown" as const,
  assertComplete(): void {
    // no-op
  },
  render() {
    return {
      format: "markdown" as const,
      primary: { relPath: "x.md", mimeType: "text/markdown", body: "" },
    };
  },
};

function snapshot(i18n: AirpDocumentSnapshot["i18n"]): AirpDocumentSnapshot {
  return {
    schemaVersion: "1.1.0",
    meta: { title: "t" },
    i18n,
    blocks: [],
  };
}

describe("resolveRenderLocales", () => {
  it("builds context with the document locale", () => {
    const document = snapshot({ locale: "ja-JP" });
    const result = resolveRenderLocales(document, {}, stubModule);
    expect(result.diagnostics).toEqual([]);
    expect(result.ctx?.locale).toBe("ja-JP");
    expect(result.ctx?.document).toBe(document);
  });

  it("uses defaultLocale when locale is absent", () => {
    const document = snapshot({ defaultLocale: "en", locales: ["en"] });
    const result = resolveRenderLocales(document, {}, stubModule);
    expect(result.ctx?.locale).toBe("en");
  });

  it("fails closed when locale cannot be resolved", () => {
    const result = resolveRenderLocales(snapshot({}), {}, stubModule);
    expect(result.ctx).toBeUndefined();
    expect(result.diagnostics[0]?.code).toBe(
      RENDERER_PIPELINE_LOCALE_UNRESOLVED.code
    );
  });
});

describe("documentRenderLocale", () => {
  it("prefers i18n.locale over defaultLocale", () => {
    expect(
      documentRenderLocale(
        snapshot({ locale: "zh-CN", defaultLocale: "en", locales: ["en"] })
      )
    ).toBe("zh-CN");
  });
});
