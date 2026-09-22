import type { AirpDocumentModel } from "@airp/renderer-shared";
import { htmlLocaleMessage } from "../i18n/html-locale.js";
import { escapeHtml } from "../shared/escape-html.js";
import { resolveDocTimeIso } from "./resolve-doc-attribution.js";

/** Emit document meta bits for schemaVersion 1.0.0 (authors + updated time). */
export function documentMeta100(
  doc: AirpDocumentModel,
  locale: string,
  labelSep: string
): string[] {
  const metaBits: string[] = [];
  if (doc.meta.authors?.length) {
    const authorsLabel = escapeHtml(
      htmlLocaleMessage("emit.doc-authors-label", locale)
    );
    metaBits.push(
      `<div class="flex items-center gap-1.5" data-doc-authors="true"><span style="color: var(--text-muted)" data-doc-meta-label="true">${authorsLabel}${labelSep}</span><span class="font-medium" data-doc-meta-value="true" style="color: var(--text-main)">${escapeHtml(doc.meta.authors.join(", "))}</span></div>`
    );
  }

  const updatedIso = resolveDocTimeIso(doc.meta);
  if (updatedIso) {
    const updatedLabel = escapeHtml(
      htmlLocaleMessage("emit.doc-updated-label", locale)
    );
    metaBits.push(
      `<div class="flex items-center gap-1.5"><time class="font-mono" data-doc-time="true" data-doc-time-label="${updatedLabel}" data-doc-time-sep="${escapeHtml(labelSep)}" datetime="${escapeHtml(updatedIso)}"><span style="color: var(--text-muted)" data-doc-meta-label="true" data-doc-time-text>${updatedLabel}${labelSep}</span></time></div>`
    );
  }
  return metaBits;
}
