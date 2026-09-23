import { describe, expect, it } from "vitest";
import { validateDocument } from "../src/index.js";

describe("i18n unknown locale key", () => {
  it("rejects LocalizedString keys outside i18n.locales", async () => {
    const result = await validateDocument({
      schemaVersion: "1.0.0",
      meta: {
        title: { en: "Hello", ja: "こんにちは" },
        kind: "generic",
        createdAt: "2026-09-14T12:00:00.000Z",
      },
      i18n: {
        defaultLocale: "en",
        locales: ["en"],
      },
      blocks: [{ type: "paragraph", text: "x" }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(
      result.diagnostics.some(
        (d) => d.code === "validate.validators.i18n.unknown-locale-key"
      )
    ).toBe(true);
  });

  it("rejects RichText object keys outside i18n.locales", async () => {
    const result = await validateDocument({
      schemaVersion: "1.0.0",
      meta: {
        title: "Hello",
        kind: "generic",
        createdAt: "2026-09-14T12:00:00.000Z",
      },
      i18n: {
        defaultLocale: "en",
        locales: ["en"],
      },
      blocks: [
        {
          type: "paragraph",
          text: { en: "Hello", ja: "こんにちは" },
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(
      result.diagnostics.some(
        (d) => d.code === "validate.validators.i18n.unknown-locale-key"
      )
    ).toBe(true);
  });
});
