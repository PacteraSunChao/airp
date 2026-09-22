export const defaultLocale = "en-US";

/**
 * Document BCP47 code → html-locale file stem.
 * Unlisted locales fall back to `en-us` messages.
 */
export const locales: Record<string, string> = {
  en: "en-us",
  "en-US": "en-us",
  "zh-CN": "zh-cn",
  "zh-Hans": "zh-cn",
  "ja-JP": "ja-jp",
  "ko-KR": "ko-kr",
  "de-DE": "de-de",
  "fr-FR": "fr-fr",
  "ru-RU": "ru-ru",
  "es-ES": "es-es",
  "pt-BR": "pt-br",
  "it-IT": "it-it",
};
