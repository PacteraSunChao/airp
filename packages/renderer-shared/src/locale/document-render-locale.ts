import type { AirpDocumentSnapshot } from "@airp/renderer-contract";

/**
 * Derive the document content locale:
 * - schema 1.1.0: `i18n.locale`
 * - schema 1.0.0: `i18n.defaultLocale`
 */
export function documentRenderLocale(
  document: AirpDocumentSnapshot
): string | undefined {
  const { locale, defaultLocale } = document.i18n;
  if (typeof locale === "string" && locale.length > 0) {
    return locale;
  }
  if (typeof defaultLocale === "string" && defaultLocale.length > 0) {
    return defaultLocale;
  }
  return undefined;
}
