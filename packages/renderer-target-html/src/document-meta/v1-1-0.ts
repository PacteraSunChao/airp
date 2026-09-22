import type { AirpDocumentModel } from "@airp/renderer-shared";
import { htmlLocaleMessage } from "../i18n/html-locale.js";
import { escapeHtml } from "../shared/escape-html.js";
import {
  resolveDocTimeIso,
  resolveDocUpdatedBy,
} from "./resolve-doc-attribution.js";

/**
 * Emit document meta bits for schemaVersion 1.1.0.
 * Single line: last updated — updatedBy + updatedAt (client hydrates local time).
 */
export function documentMeta110(
  doc: AirpDocumentModel,
  locale: string,
  labelSep: string
): string[] {
  const updatedIso = resolveDocTimeIso(doc.meta);
  if (!updatedIso) {
    return [];
  }

  const updatedBy = resolveDocUpdatedBy(doc.meta);
  const lastUpdatedLabel = escapeHtml(
    htmlLocaleMessage("emit.doc-last-updated-label", locale)
  );
  const byAttr = updatedBy
    ? ` data-doc-time-by="${escapeHtml(updatedBy)}"`
    : "";
  const byPrefix = updatedBy ? `${escapeHtml(updatedBy)} ` : "";

  return [
    `<div class="flex items-center gap-1.5" data-doc-last-updated="true"><time class="font-mono" data-doc-time="true" data-doc-time-label="${lastUpdatedLabel}" data-doc-time-sep="${escapeHtml(labelSep)}"${byAttr} datetime="${escapeHtml(updatedIso)}"><span style="color: var(--text-muted)" data-doc-meta-label="true" data-doc-time-text>${lastUpdatedLabel}${labelSep}${byPrefix}</span></time></div>`,
  ];
}
