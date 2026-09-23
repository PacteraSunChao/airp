import {
  assertSchemaVersion,
  type SchemaVersion,
  type VersionRegistry,
} from "@airp/protocol";
import type {
  AirpDocumentModel,
  LocalizedString,
} from "../../document-model.js";
import { resolveLocalized100 } from "./v1-0-0.js";
import { resolveLocalized110 } from "./v1-1-0.js";

export type ResolveLocalized = (
  value: LocalizedString | undefined,
  locale: string,
  doc: AirpDocumentModel
) => string;

const RESOLVE_LOCALIZED = {
  "1.0.0": (value, locale, doc) => resolveLocalized100(value, locale, doc),
  "1.1.0": (value, locale) => resolveLocalized110(value, locale),
} as const satisfies VersionRegistry<ResolveLocalized>;

/** Resolve LocalizedString for a supported schema version. */
export function resolveLocalizedFor(version: SchemaVersion): ResolveLocalized {
  return RESOLVE_LOCALIZED[version];
}

/**
 * Fold a LocalizedString at the knocked-in locale, dispatched by
 * `doc.schemaVersion`.
 */
export function resolveLocalized(
  value: LocalizedString | undefined,
  locale: string,
  doc: AirpDocumentModel
): string {
  assertSchemaVersion(doc.schemaVersion);
  return resolveLocalizedFor(doc.schemaVersion)(value, locale, doc);
}
