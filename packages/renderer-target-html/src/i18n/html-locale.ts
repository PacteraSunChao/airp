import { messages as deDeMessages } from "./locale/de-de.js";
import { messages as enUsMessages } from "./locale/en-us.js";
import { messages as esEsMessages } from "./locale/es-es.js";
import { messages as frFrMessages } from "./locale/fr-fr.js";
import { messages as itItMessages } from "./locale/it-it.js";
import { messages as jaJpMessages } from "./locale/ja-jp.js";
import { messages as koKrMessages } from "./locale/ko-kr.js";
import { messages as ptBrMessages } from "./locale/pt-br.js";
import { messages as ruRuMessages } from "./locale/ru-ru.js";
import { messages as zhCnMessages } from "./locale/zh-cn.js";
import { locales } from "./locale.js";

const PACK = "html-locale";

const messageCatalog: Record<string, Record<string, string>> = {
  "en-us": enUsMessages,
  "zh-cn": zhCnMessages,
  "ja-jp": jaJpMessages,
  "ko-kr": koKrMessages,
  "de-de": deDeMessages,
  "fr-fr": frFrMessages,
  "ru-ru": ruRuMessages,
  "es-es": esEsMessages,
  "pt-br": ptBrMessages,
  "it-it": itItMessages,
};

function messagesForLocale(locale: string): Record<string, string> {
  const stem = locales[locale] ?? "en-us";
  return messageCatalog[stem] ?? enUsMessages;
}

function requireTemplate(key: string, locale: string): string {
  const template = messagesForLocale(locale)[key];
  if (template == null) {
    throw new Error(`Missing ${PACK} message: ${key} (${locale})`);
  }
  return template;
}

/** Resolve an html-locale message for the knocked-in primary locale. */
export function htmlLocaleMessage(key: string, locale: string): string {
  return requireTemplate(key, locale);
}
