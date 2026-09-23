import { AirpDiagnosticError } from "@airp/diagnostics";
import { describe, expect, it } from "vitest";
import { RENDERER_SHARED_LOCALE_LOCALIZED_STRING_MISSING } from "../src/diagnostic-codes.js";
import type { AirpDocumentModel } from "../src/document-model.js";
import { resolveLocalized } from "../src/locale/resolve-localized/registry.js";
import { resolveRichText } from "../src/locale/resolve-rich-text.js";

function doc100(
  overrides?: Partial<AirpDocumentModel["i18n"]>
): AirpDocumentModel {
  return {
    schemaVersion: "1.0.0",
    meta: { title: "t" },
    i18n: {
      defaultLocale: "en",
      locales: ["en", "zh-CN"],
      ...overrides,
    },
    blocks: [],
  };
}

function doc110(): AirpDocumentModel {
  return {
    schemaVersion: "1.1.0",
    meta: { title: "t" },
    i18n: { locale: "en" },
    blocks: [],
  };
}

describe("resolveLocalized 1.0.0", () => {
  it("returns plain strings and empty for undefined", () => {
    expect(resolveLocalized("hello", "en", doc100())).toBe("hello");
    expect(resolveLocalized(undefined, "en", doc100())).toBe("");
  });

  it("takes the knocked-in locale key", () => {
    expect(
      resolveLocalized({ en: "Hi", "zh-CN": "你好" }, "zh-CN", doc100())
    ).toBe("你好");
  });

  it("falls back along defaultLocale → locales → first key", () => {
    expect(resolveLocalized({ en: "Hi" }, "zh-CN", doc100())).toBe("Hi");
    expect(
      resolveLocalized(
        { "zh-CN": "你好" },
        "ja",
        doc100({ defaultLocale: "en", locales: ["en", "zh-CN"] })
      )
    ).toBe("你好");
    expect(
      resolveLocalized(
        { fr: "Bonjour" },
        "ja",
        doc100({ defaultLocale: "en", locales: ["en"] })
      )
    ).toBe("Bonjour");
  });
});

describe("resolveLocalized 1.1.0", () => {
  it("takes the knocked-in locale key", () => {
    expect(
      resolveLocalized({ en: "Hi", "zh-CN": "你好" }, "zh-CN", doc110())
    ).toBe("你好");
  });

  it("hard-fails when the locale key is missing", () => {
    expect(() => resolveLocalized({ en: "Hi" }, "zh-CN", doc110())).toThrow(
      AirpDiagnosticError
    );
    try {
      resolveLocalized({ en: "Hi" }, "zh-CN", doc110());
    } catch (error) {
      expect(error).toBeInstanceOf(AirpDiagnosticError);
      const diagnostics = (error as AirpDiagnosticError).diagnostics;
      expect(diagnostics[0]?.code).toBe(
        RENDERER_SHARED_LOCALE_LOCALIZED_STRING_MISSING.code
      );
    }
  });
});

describe("resolveRichText", () => {
  it("passes plain markdown-lite strings through", () => {
    expect(resolveRichText("**bold** and `code`", "en", doc110())).toBe(
      "**bold** and `code`"
    );
  });

  it("folds an object map with versioned resolveLocalized", () => {
    expect(
      resolveRichText({ en: "Hi", "zh-CN": "你好" }, "zh-CN", doc100())
    ).toBe("你好");
    expect(resolveRichText({ en: "Hi" }, "zh-CN", doc100())).toBe("Hi");
  });

  it("renders inline nodes", () => {
    expect(
      resolveRichText(
        [
          { type: "text", value: "See " },
          {
            type: "link",
            href: "https://example.com",
            children: [{ type: "text", value: "docs" }],
          },
        ],
        "en",
        doc100()
      )
    ).toBe("See [docs](https://example.com)");
  });
});
