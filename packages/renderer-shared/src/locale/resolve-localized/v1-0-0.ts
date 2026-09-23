import type { LocalizedString } from "../../document-model.js";

/**
 * Fold a LocalizedString at the knocked-in locale (schema 1.0.0).
 * Fallback: current locale → defaultLocale → first valued locale in
 * `i18n.locales` → first object entry.
 */
export function resolveLocalized100(
  value: LocalizedString | undefined,
  locale: string,
  doc: {
    i18n: {
      defaultLocale?: string;
      locales?: readonly string[];
    };
  }
): string {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  const keys = Object.keys(value);
  const fromLocale = value[locale];
  if (typeof fromLocale === "string") {
    return fromLocale;
  }
  const defaultLocale = doc.i18n.defaultLocale;
  if (typeof defaultLocale === "string") {
    const fromDefault = value[defaultLocale];
    if (typeof fromDefault === "string") {
      return fromDefault;
    }
  }
  for (const loc of doc.i18n.locales ?? []) {
    const fromListed = value[loc];
    if (typeof fromListed === "string") {
      return fromListed;
    }
  }
  const first = keys[0];
  return first ? (value[first] ?? "") : "";
}
