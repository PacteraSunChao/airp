import { describe, expect, it } from "vitest";
import { htmlLocaleMessage } from "../src/i18n/html-locale.js";
import { messages as deDe } from "../src/i18n/locale/de-de.js";
import { messages as enUs } from "../src/i18n/locale/en-us.js";
import { messages as esEs } from "../src/i18n/locale/es-es.js";
import { messages as frFr } from "../src/i18n/locale/fr-fr.js";
import { messages as itIt } from "../src/i18n/locale/it-it.js";
import { messages as jaJp } from "../src/i18n/locale/ja-jp.js";
import { messages as koKr } from "../src/i18n/locale/ko-kr.js";
import { messages as ptBr } from "../src/i18n/locale/pt-br.js";
import { messages as ruRu } from "../src/i18n/locale/ru-ru.js";
import { messages as zhCn } from "../src/i18n/locale/zh-cn.js";
import { defaultLocale, locales } from "../src/i18n/locale.js";

const packs: Record<string, Record<string, string>> = {
  "en-us": enUs,
  "zh-cn": zhCn,
  "ja-jp": jaJp,
  "ko-kr": koKr,
  "de-de": deDe,
  "fr-fr": frFr,
  "ru-ru": ruRu,
  "es-es": esEs,
  "pt-br": ptBr,
  "it-it": itIt,
};

const chromeLocales = [
  "en-US",
  "zh-CN",
  "ja-JP",
  "ko-KR",
  "de-DE",
  "fr-FR",
  "ru-RU",
  "es-ES",
  "pt-BR",
  "it-IT",
] as const;

describe("html-locale packs", () => {
  it("ships exactly ten message stems aligned with chrome locales", () => {
    expect(Object.keys(packs).sort()).toEqual(
      [
        "de-de",
        "en-us",
        "es-es",
        "fr-fr",
        "it-it",
        "ja-jp",
        "ko-kr",
        "pt-br",
        "ru-ru",
        "zh-cn",
      ].sort()
    );
    expect(defaultLocale).toBe("en-US");
    for (const locale of chromeLocales) {
      expect(locales[locale]).toBeDefined();
    }
    expect(locales.en).toBe("en-us");
  });

  it("keeps identical message keys across every pack", () => {
    const expected = Object.keys(enUs).sort();
    for (const [stem, messages] of Object.entries(packs)) {
      expect(Object.keys(messages).sort(), stem).toEqual(expected);
      for (const key of expected) {
        expect(messages[key]?.length ?? 0, `${stem}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("resolves a sample key for each chrome locale without falling back silently", () => {
    for (const locale of chromeLocales) {
      const value = htmlLocaleMessage("emit.doc-last-updated-label", locale);
      expect(value.length).toBeGreaterThan(0);
    }
    expect(htmlLocaleMessage("emit.doc-last-updated-label", "en")).toBe(
      enUs["emit.doc-last-updated-label"]
    );
  });
});
