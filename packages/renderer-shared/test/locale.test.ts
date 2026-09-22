import { AirpDiagnosticError } from "@airp/diagnostics";
import { describe, expect, it } from "vitest";
import { RENDERER_SHARED_LOCALE_LOCALIZED_STRING_MISSING } from "../src/diagnostic-codes.js";
import { resolveLocalized } from "../src/locale/resolve-localized.js";
import { resolveRichText } from "../src/locale/resolve-rich-text.js";

describe("resolveLocalized", () => {
  it("returns plain strings and empty for undefined", () => {
    expect(resolveLocalized("hello", "en")).toBe("hello");
    expect(resolveLocalized(undefined, "en")).toBe("");
  });

  it("takes the knocked-in locale key", () => {
    expect(resolveLocalized({ en: "Hi", "zh-CN": "你好" }, "zh-CN")).toBe(
      "你好"
    );
  });

  it("hard-fails when the locale key is missing", () => {
    expect(() => resolveLocalized({ en: "Hi" }, "zh-CN")).toThrow(
      AirpDiagnosticError
    );
    try {
      resolveLocalized({ en: "Hi" }, "zh-CN");
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
    expect(resolveRichText("**bold** and `code`", "en")).toBe(
      "**bold** and `code`"
    );
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
        "en"
      )
    ).toBe("See [docs](https://example.com)");
  });
});
