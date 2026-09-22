import { AirpDiagnosticError, diagnostic } from "@airp/diagnostics";
import { isRecord } from "@airp/utils";
import { RENDERER_SHARED_LOCALE_LOCALIZED_STRING_MISSING } from "../diagnostic-codes.js";
import type { LocalizedString } from "../document-model.js";

/**
 * Fold a LocalizedString at the knocked-in locale.
 * Missing object key → hard fail (no defaultLocale fallback).
 */
export function resolveLocalized(
  value: LocalizedString | undefined,
  locale: string
): string {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (!isRecord(value)) {
    throw new AirpDiagnosticError([
      diagnostic(
        RENDERER_SHARED_LOCALE_LOCALIZED_STRING_MISSING,
        "LocalizedString must be a string or locale map",
        { details: { locale } }
      ),
    ]);
  }
  const text = value[locale];
  if (typeof text === "string") {
    return text;
  }
  throw new AirpDiagnosticError([
    diagnostic(
      RENDERER_SHARED_LOCALE_LOCALIZED_STRING_MISSING,
      `LocalizedString has no entry for locale "${locale}"`,
      { details: { locale, keys: Object.keys(value) } }
    ),
  ]);
}
