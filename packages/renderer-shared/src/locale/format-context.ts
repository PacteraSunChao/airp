import { assertSchemaVersion } from "@airp/protocol";
import type {
  AirpDocumentModel,
  LocalizedString,
  RichText,
} from "../document-model.js";
import { resolveLocalizedFor } from "./resolve-localized/registry.js";
import { resolveRichText } from "./resolve-rich-text.js";

export interface LocaleFormatContext {
  doc: AirpDocumentModel;
  locale: string;
  t: (value: LocalizedString | undefined) => string;
  tr: (value: RichText | undefined) => string;
  ui: (key: string, fallback: string) => string;
}

/** Resolve schema 1.0.0 `i18n.ui` overrides; 1.1.0 has no `ui` field. */
function resolveUi(
  doc: AirpDocumentModel,
  locale: string,
  key: string,
  fallback: string
): string {
  const ui = doc.i18n.ui;
  if (!ui) {
    return fallback;
  }

  const fromLocale = ui[locale]?.[key];
  if (fromLocale) {
    return fromLocale;
  }
  const defaultLocale = doc.i18n.defaultLocale;
  if (defaultLocale) {
    const fromDefault = ui[defaultLocale]?.[key];
    if (fromDefault) {
      return fromDefault;
    }
  }
  return fallback;
}

/** Build t / tr / ui helpers bound to a knocked-in locale and schema version. */
export function createLocaleFormatContext(
  doc: AirpDocumentModel,
  locale: string
): LocaleFormatContext {
  assertSchemaVersion(doc.schemaVersion);
  const resolveLocalized = resolveLocalizedFor(doc.schemaVersion);
  return {
    doc,
    locale,
    t: (value) => resolveLocalized(value, locale, doc),
    tr: (value) => resolveRichText(value, locale, doc),
    ui: (key, fallback) => resolveUi(doc, locale, key, fallback),
  };
}
