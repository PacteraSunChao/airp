import { assertSchemaVersion } from "@airp/protocol";
import type { AirpDocumentSnapshot } from "@airp/renderer-contract";
import {
  asDocumentModel,
  createLocaleFormatContext,
} from "@airp/renderer-shared";
import { assemblePage } from "./components/page.js";
import { renderPageToc } from "./components/page-toc.js";
import { documentMetaFor } from "./document-meta/registry.js";
import { type EmitBlocksOptions, emitBlocks } from "./emit-block.js";
import { htmlLocaleMessage } from "./i18n/html-locale.js";
import { renderIcon } from "./icons/render-icon.js";
import { escapeHtml } from "./shared/escape-html.js";
import { AIRP_PROTOCOL_DISPLAY_VERSION } from "./shared/product-chrome.js";

function emitSourceRefs(
  refs: readonly {
    label?: unknown;
    type: string;
    value: string;
  }[],
  t: (value: never) => string,
  locale: string
): string {
  if (refs.length === 0) {
    return "";
  }
  const sourcesLabel = escapeHtml(
    htmlLocaleMessage("emit.doc-sources-label", locale)
  );

  const renderMenuRef = (ref: {
    label?: unknown;
    type: string;
    value: string;
  }): string => {
    const labelText = ref.label == null ? ref.value : t(ref.label as never);
    const label = escapeHtml(labelText);
    const value =
      labelText === ref.value
        ? ""
        : `<span class="block truncate text-[10px] font-mono mt-0.5" style="color: var(--text-muted)">${escapeHtml(ref.value)}</span>`;
    const icon = renderIcon(
      ref.type === "url" ? "git-pull-request" : "file-text",
      { className: "size-4 shrink-0" }
    );
    const iconBox = `<span class="flex size-8 shrink-0 items-center justify-center rounded-lg text-sky-600 dark:text-sky-400" style="background-color: var(--bg-subtle)">${icon}</span>`;
    const copy = `<span class="min-w-0 flex-1"><span class="block truncate text-xs font-medium" style="color: var(--text-main)">${label}</span>${value}</span>`;
    if (ref.type === "url") {
      const external = renderIcon("external-link", {
        className: "size-3.5 shrink-0 text-[var(--text-muted)]",
      });
      return `<a class="flex min-w-0 items-center gap-3 rounded-lg px-2.5 py-2 no-underline transition hover:bg-slate-50 dark:hover:bg-slate-800/60" data-doc-source-ref="true" href="${escapeHtml(ref.value)}" rel="noopener noreferrer" target="_blank">${iconBox}${copy}${external}</a>`;
    }
    return `<div class="flex min-w-0 items-center gap-3 rounded-lg px-2.5 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-800/60" data-doc-source-ref="true" data-source-type="${escapeHtml(ref.type)}">${iconBox}${copy}</div>`;
  };

  const items = refs.map(renderMenuRef).join("");
  const triggerIcon = renderIcon("book-open", {
    className: "size-3.5 shrink-0",
  });
  const menuIcon = renderIcon("book-open", {
    className: "size-3.5 shrink-0 text-sky-500",
  });
  return `<div class="relative inline-block shrink-0" data-doc-sources="true" data-doc-sources-menu="true"><button type="button" class="airp-interactive inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border focus:outline-none focus:ring-2 focus:ring-sky-500/40" data-doc-sources-menu-trigger="true" aria-expanded="false" aria-haspopup="menu" aria-label="${sourcesLabel}" title="${sourcesLabel}" style="background-color: var(--bg-surface); border-color: var(--border-color); color: var(--text-secondary)">${triggerIcon}<span class="text-xs font-medium">${sourcesLabel}</span></button><div class="airp-float-panel fixed z-popover w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border p-2" data-doc-sources-menu-panel="true" role="menu" aria-hidden="true" style="left: 12px; top: 12px; background-color: var(--bg-surface); border-color: var(--border-color); box-shadow: var(--shadow-float)"><div class="flex items-center justify-between gap-3 px-2.5 py-2 border-b" style="border-color: var(--border-subtle)"><span class="flex items-center gap-2 text-xs font-semibold" style="color: var(--text-main)">${menuIcon}${sourcesLabel}</span><span class="inline-flex min-w-5 h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-mono" style="background-color: var(--bg-subtle); color: var(--text-muted)">${refs.length}</span></div><div class="pt-1">${items}</div></div></div>`;
}

/** Emit the HTML article body for a knocked-in locale. */
export function emitDocumentBody(
  snapshot: AirpDocumentSnapshot,
  locale: string,
  options: EmitBlocksOptions = {}
): {
  bodyHtml: string;
  pageTocHtml: string;
  schemaVersion: string;
  title: string;
} {
  const doc = asDocumentModel(snapshot);
  const { t } = createLocaleFormatContext(doc, locale);
  const title = t(doc.meta.title as never);
  const subtitle = doc.meta.subtitle ? t(doc.meta.subtitle as never) : "";
  const schemaVersion =
    typeof doc.schemaVersion === "string" && doc.schemaVersion.length > 0
      ? doc.schemaVersion
      : AIRP_PROTOCOL_DISPLAY_VERSION;

  const headerParts: string[] = [];
  headerParts.push(
    `<header class="border-b pb-8" data-doc-header="true" style="border-color: var(--border-color)">`
  );

  const chipRow: string[] = [
    `<span class="text-xs font-mono px-2.5 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800" data-doc-protocol-badge="true">AI Report Protocol v${escapeHtml(schemaVersion)}</span>`,
  ];
  if (doc.meta.tags?.length) {
    chipRow.push(
      ...doc.meta.tags.map(
        (tag) =>
          `<span class="text-xs font-mono px-2.5 py-0.5 rounded-full border" data-doc-tag="true" style="background-color: var(--bg-subtle); color: var(--text-secondary); border-color: var(--border-color)">${escapeHtml(String(tag))}</span>`
      )
    );
  }
  headerParts.push(
    `<div class="flex flex-wrap items-center gap-2 mb-4" data-doc-tags="true">${chipRow.join("")}</div>`
  );

  headerParts.push(
    `<h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 [overflow-wrap:anywhere]" style="color: var(--text-main)">${escapeHtml(title)}</h1>`
  );
  if (subtitle) {
    headerParts.push(
      `<p class="text-base sm:text-lg leading-relaxed mb-6" data-doc-subtitle="true" style="color: var(--text-secondary)">${escapeHtml(subtitle)}</p>`
    );
  }

  const labelSep = locale.toLowerCase().startsWith("zh") ? "：" : ": ";
  assertSchemaVersion(doc.schemaVersion);
  const metaBits = documentMetaFor(doc.schemaVersion)(doc, locale, labelSep);

  const sourceRefs = Array.isArray(doc.meta.sourceRefs)
    ? (doc.meta.sourceRefs as {
        label?: unknown;
        type: string;
        value: string;
      }[])
    : [];
  const sourcesHtml = emitSourceRefs(sourceRefs, t, locale);

  if (metaBits.length > 0 || sourcesHtml) {
    const left =
      metaBits.length > 0
        ? `<div class="flex items-center gap-4 flex-wrap" data-doc-meta="true">${metaBits.join("")}</div>`
        : "";
    headerParts.push(
      `<div class="flex flex-wrap items-center justify-between gap-4 text-xs pt-4 border-t" data-doc-meta-row="true" style="border-color: var(--border-subtle); color: var(--text-secondary)">${left}${sourcesHtml}</div>`
    );
  }

  headerParts.push("</header>");

  const { html: blocksHtml, tocEntries } = emitBlocks(
    doc.blocks,
    doc,
    locale,
    options
  );
  const bodyHtml = assemblePage([headerParts.join(""), blocksHtml]);
  const pageTocHtml = renderPageToc(tocEntries, locale);
  return { bodyHtml, pageTocHtml, schemaVersion, title };
}
