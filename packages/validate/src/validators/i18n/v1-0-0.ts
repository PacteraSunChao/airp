import { type AirpDiagnostic, diagnostic } from "@airp/diagnostics";
import { isRecord } from "@airp/utils";
import {
  VALIDATE_VALIDATORS_I18N_DEFAULT_LOCALE_MISSING,
  VALIDATE_VALIDATORS_I18N_LOCALIZED_STRING_MISSING_DEFAULT,
  VALIDATE_VALIDATORS_I18N_UNKNOWN_LOCALE_KEY,
} from "../../diagnostic-codes.js";
import type { ValidationStageResult } from "../../types.js";
import { validationStageResult } from "../../validation-stage-result.js";

const LOCALE_CODE_RE = /^[a-z]{2}(-[A-Z]{2})?$/;

function isLocaleMap(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) {
    return false;
  }
  const keys = Object.keys(value);
  if (keys.length === 0) {
    return false;
  }
  return keys.every(
    (key) => LOCALE_CODE_RE.test(key) && typeof value[key] === "string"
  );
}

function walkLocalizedStrings(
  value: unknown,
  path: string,
  visit: (map: Record<string, string>, path: string) => void
): void {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      walkLocalizedStrings(value[i], `${path}/${i}`, visit);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }

  // i18n config itself is not a LocalizedString.
  if (path === "/i18n") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "defaultLocale" || key === "locales") {
        continue;
      }
      walkLocalizedStrings(child, `${path}/${key}`, visit);
    }
    return;
  }

  if (isLocaleMap(value)) {
    visit(value, path);
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    walkLocalizedStrings(child, `${path}/${key}`, visit);
  }
}

/** Enforce defaultLocale membership and LocalizedString locale keys. */
export function i18n100(
  document: Record<string, unknown>
): ValidationStageResult {
  const diagnostics: AirpDiagnostic[] = [];
  const i18n = document.i18n;

  if (!isRecord(i18n)) {
    return validationStageResult("i18n", diagnostics);
  }

  const defaultLocale = i18n.defaultLocale;
  const locales = i18n.locales;

  if (typeof defaultLocale !== "string" || !Array.isArray(locales)) {
    return validationStageResult("i18n", diagnostics);
  }

  const localeSet = new Set(
    locales.filter((item): item is string => typeof item === "string")
  );

  if (!localeSet.has(defaultLocale)) {
    diagnostics.push(
      diagnostic(
        VALIDATE_VALIDATORS_I18N_DEFAULT_LOCALE_MISSING,
        `defaultLocale "${defaultLocale}" is not listed in i18n.locales`,
        { location: { path: "/i18n/defaultLocale" } }
      )
    );
  }

  walkLocalizedStrings(document, "", (map, path) => {
    if (!(defaultLocale in map)) {
      diagnostics.push(
        diagnostic(
          VALIDATE_VALIDATORS_I18N_LOCALIZED_STRING_MISSING_DEFAULT,
          `LocalizedString must include defaultLocale key "${defaultLocale}"`,
          { location: { path: path || "/" } }
        )
      );
    }
    for (const key of Object.keys(map)) {
      if (!localeSet.has(key)) {
        diagnostics.push(
          diagnostic(
            VALIDATE_VALIDATORS_I18N_UNKNOWN_LOCALE_KEY,
            `LocalizedString key "${key}" is not listed in i18n.locales`,
            { location: { path: `${path || ""}/${key}` } }
          )
        );
      }
    }
  });

  return validationStageResult("i18n", diagnostics);
}
