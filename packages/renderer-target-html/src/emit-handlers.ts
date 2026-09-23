import { AirpDiagnosticError, diagnostic } from "@airp/diagnostics";
import { citationItemsHtmlFor } from "./citation-items/registry.js";
import {
  RENDERER_TARGETS_HTML_AT_ID_MISSING,
  RENDERER_TARGETS_HTML_MERMAID_NODE_REQUIRED,
} from "./diagnostic-codes.js";
import type { EmitContext, EmitHandler } from "./emit-helpers.js";
import {
  asBlocks,
  attr,
  cellTextHtml,
  childHeadingCtx,
  extractBulletListRows,
  formatPlain,
  formatRichHtml,
  headingBlockClass,
  headingBlockStyle,
  headingTag,
  loc,
  sectionHeadingLevel,
  sectionTitleClass,
  stripLeadingOrdinal,
  wrapBlock,
} from "./emit-helpers.js";
import { htmlLocaleMessage } from "./i18n/html-locale.js";
import type { IconName } from "./icons/render-icon.js";
import { renderIcon } from "./icons/render-icon.js";
import { sectionAnchorFor } from "./section-anchor/registry.js";
import {
  collapsibleStorageKey,
  svgViewerStorageKey,
  tabsStorageKey,
} from "./shared/client-storage-keys.js";
import { escapeHtml } from "./shared/escape-html.js";
import {
  countUnifiedDiffStats,
  renderCodeDiffSplitBody,
  renderCodeDiffSplitChrome,
  renderCodeDiffUnifiedChrome,
} from "./shared/render-code-diff.js";
import {
  renderCodeShell,
  renderPlainCodePre,
} from "./shared/render-code-shell.js";
import {
  DECISION_STATUS_VISUAL,
  RISK_STATUS_VISUAL,
  renderAccentBadge,
  renderStatusBadge,
} from "./shared/render-status-badge.js";
import { renderSvgViewer } from "./shared/render-svg-viewer.js";

const MERMAID_VIEWER_MIN_HEIGHT_PX = 320;
const METRIC_DELTA_NEGATIVE = /^\s*-/;

let emitBlockRef: (
  block: unknown,
  ctx: EmitContext,
  levelOffset?: number
) => string = () => "";

export function setEmitBlockRef(
  fn: (block: unknown, ctx: EmitContext, levelOffset?: number) => string
): void {
  emitBlockRef = fn;
}

function emitChildren(
  blocks: unknown[],
  ctx: EmitContext,
  levelOffset = 0
): string {
  return blocks.map((b) => emitBlockRef(b, ctx, levelOffset)).join("");
}

function takeMermaidSvgOrFail(ctx: EmitContext): string {
  if (!ctx.takeMermaidSvg) {
    throw new AirpDiagnosticError([
      diagnostic(
        RENDERER_TARGETS_HTML_MERMAID_NODE_REQUIRED,
        "Mermaid→SVG requires @airp/renderer-target-html/node"
      ),
    ]);
  }
  return ctx.takeMermaidSvg();
}

const AT_ID_PATTERN = /^[a-z0-9]{10}$/;

/**
 * svg-viewer localStorage instance id: schema 1.1.0 uses the diagram block's
 * `@id`; 1.0.0 MermaidBlock has no id, so fall back to document-order `mermaid-N`.
 */
function mermaidViewerInstance(
  ctx: EmitContext,
  diagramBlock: Record<string, unknown>
): string {
  if (ctx.schemaVersion === "1.1.0") {
    const atId = diagramBlock["@id"];
    if (typeof atId === "string" && AT_ID_PATTERN.test(atId)) {
      return atId;
    }
    throw new AirpDiagnosticError([
      diagnostic(
        RENDERER_TARGETS_HTML_AT_ID_MISSING,
        "Mermaid diagram is missing a valid @id machine handle",
        { details: { atId } }
      ),
    ]);
  }
  ctx.mermaidViewerSeq.next += 1;
  return `mermaid-${ctx.mermaidViewerSeq.next}`;
}

/**
 * collapsible localStorage instance id: schema 1.1.0 uses `@id`; 1.0.0 has no
 * id on CollapsibleBlock, so fall back to document-order `collapsible-N`.
 */
function collapsibleInstance(
  ctx: EmitContext,
  block: Record<string, unknown>
): string {
  if (ctx.schemaVersion === "1.1.0") {
    const atId = block["@id"];
    if (typeof atId === "string" && AT_ID_PATTERN.test(atId)) {
      return atId;
    }
    throw new AirpDiagnosticError([
      diagnostic(
        RENDERER_TARGETS_HTML_AT_ID_MISSING,
        "Collapsible is missing a valid @id machine handle",
        { details: { atId } }
      ),
    ]);
  }
  ctx.collapsibleSeq.next += 1;
  return `collapsible-${ctx.collapsibleSeq.next}`;
}

function tabsInstance(
  ctx: EmitContext,
  block: Record<string, unknown>,
  sequence: number
): string {
  if (ctx.schemaVersion === "1.1.0") {
    const atId = block["@id"];
    if (typeof atId === "string" && AT_ID_PATTERN.test(atId)) {
      return atId;
    }
    throw new AirpDiagnosticError([
      diagnostic(
        RENDERER_TARGETS_HTML_AT_ID_MISSING,
        "Tabs is missing a valid @id machine handle",
        { details: { atId } }
      ),
    ]);
  }
  return `tabs-${sequence}`;
}

function tabsPanelKey(
  ctx: EmitContext,
  panel: Record<string, unknown>,
  index: number
): string {
  if (ctx.schemaVersion === "1.1.0") {
    const atId = panel["@id"];
    if (typeof atId === "string" && AT_ID_PATTERN.test(atId)) {
      return atId;
    }
    throw new AirpDiagnosticError([
      diagnostic(
        RENDERER_TARGETS_HTML_AT_ID_MISSING,
        "Tabs panel is missing a valid @id machine handle",
        { details: { atId } }
      ),
    ]);
  }
  return `panel-${index + 1}`;
}

function mermaidFigure(
  ctx: EmitContext,
  diagramBlock: Record<string, unknown>,
  titleText?: string
): string {
  const markup = takeMermaidSvgOrFail(ctx);
  if (markup.includes('data-mermaid-error="true"')) {
    return markup;
  }
  return renderSvgViewer({
    svg: markup,
    minHeight: MERMAID_VIEWER_MIN_HEIGHT_PX,
    storageKey: svgViewerStorageKey(
      "/",
      mermaidViewerInstance(ctx, diagramBlock)
    ),
    title: titleText,
  });
}

function metricValueClass(
  tone: string | undefined,
  status: string | undefined
): string {
  if (tone === "positive") {
    return "text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400";
  }
  if (tone === "negative") {
    return "text-2xl font-bold font-mono text-rose-600 dark:text-rose-400";
  }
  if (
    tone === "accent" ||
    status === "pass" ||
    status === "done" ||
    status === "in_progress"
  ) {
    return "text-2xl font-bold font-mono text-sky-600 dark:text-sky-400";
  }
  return "text-2xl font-bold font-mono";
}

function metricValueStyle(
  tone: string | undefined,
  status: string | undefined
): string {
  if (
    tone === "positive" ||
    tone === "negative" ||
    tone === "accent" ||
    status === "pass" ||
    status === "done" ||
    status === "in_progress"
  ) {
    return "";
  }
  return ' style="color: var(--text-main)"';
}

/** Shared value + optional unit row for hero metrics and collection.metric. */
function emitMetricValueRow(
  item: {
    status?: string;
    tone?: string;
    unit?: unknown;
    value?: unknown;
  },
  ctx: EmitContext,
  options: { dataAttr: string; valueClassExtra?: string }
): string {
  const tone = typeof item.tone === "string" ? item.tone : undefined;
  const status = typeof item.status === "string" ? item.status : undefined;
  const unit =
    item.unit == null
      ? ""
      : `<span class="text-xs font-mono" style="color: var(--text-muted)">${escapeHtml(String(ctx.t(item.unit as never)))}</span>`;
  const valuePlain = item.value == null ? "" : escapeHtml(String(item.value));
  if (valuePlain.length === 0) {
    return "";
  }
  const valueClass = `${metricValueClass(tone, status)}${options.valueClassExtra ? ` ${options.valueClassExtra}` : ""}`;
  return `<div class="flex items-baseline gap-1"><span class="${valueClass}" ${options.dataAttr}${metricValueStyle(tone, status)}>${valuePlain}</span>${unit}</div>`;
}

function collectionMetaBadge(meta: unknown): string {
  if (!meta || typeof meta !== "object") {
    return "";
  }
  const first = Object.values(meta as Record<string, unknown>).find(
    (v) => typeof v === "string" && v.length > 0
  );
  if (typeof first !== "string") {
    return "";
  }
  return `<span class="text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0" style="background-color: var(--bg-surface); border-color: var(--border-subtle); color: var(--text-secondary)">${escapeHtml(first)}</span>`;
}

const THREE_COLUMN_ITEM_CLASS =
  "min-w-0 flex-1 basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[30%]";

function emitCollectionMetricItem(
  item: Record<string, unknown>,
  ctx: EmitContext
): string {
  const tone = typeof item.tone === "string" ? item.tone : undefined;
  const status = typeof item.status === "string" ? item.status : undefined;
  const titlePlain = item.title ? formatPlain(ctx, item.title) : "";
  const statusChip = status
    ? renderStatusBadge(status, {
        scale: "75",
        className: "-mr-2",
      })
    : "";
  const title =
    titlePlain.length > 0
      ? `<div class="text-xs mb-1 flex items-center justify-between gap-2" style="color: var(--text-secondary)"><span>${titlePlain}</span>${statusChip}</div>`
      : "";
  const value = emitMetricValueRow(
    { tone, status, unit: item.unit, value: item.value },
    ctx,
    { dataAttr: 'data-collection-value="true"' }
  );
  const meta = collectionMetaBadge(item.meta);
  let footer = "";
  if (item.delta) {
    const deltaText = formatPlain(ctx, item.delta);
    const deltaClass =
      tone === "positive"
        ? "text-xs text-emerald-600 dark:text-emerald-400 font-medium"
        : "text-xs";
    const deltaStyle =
      tone === "positive"
        ? 'style="border-color: var(--border-color)"'
        : 'style="border-color: var(--border-color); color: var(--text-muted)"';
    footer = `<div class="mt-3 pt-2 border-t ${deltaClass}" data-collection-delta="true" ${deltaStyle}>${deltaText}</div>`;
  } else if (item.description || meta) {
    const desc = item.description
      ? `<span data-collection-description="true">${formatRichHtml(ctx, item.description)}</span>`
      : "";
    footer = `<div class="mt-3 pt-2 border-t text-xs flex items-center justify-between gap-2" style="border-color: var(--border-color); color: var(--text-muted)">${desc}${meta}</div>`;
  }
  return `<div class="${THREE_COLUMN_ITEM_CLASS} p-4 rounded-xl border flex flex-col justify-between" style="background-color: var(--bg-subtle); border-color: var(--border-subtle)" data-collection-item="true"><div>${title}${value}</div>${footer}</div>`;
}

function emitCollectionChipItem(
  item: Record<string, unknown>,
  ctx: EmitContext
): string {
  const titlePlain =
    item.title == null ? "" : String(ctx.t(item.title as never));
  const title = escapeHtml(titlePlain);
  if (typeof item.status === "string" && item.status.length > 0) {
    return renderStatusBadge(item.status, {
      label: titlePlain || undefined,
    });
  }
  const tone = typeof item.tone === "string" ? item.tone : "neutral";
  if (tone === "accent") {
    return `<span class="px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800" data-collection-chip="true" data-tone="accent">${title}</span>`;
  }
  return `<span class="px-2.5 py-1 rounded-full text-xs font-medium border" data-collection-chip="true" data-tone="${attr(tone)}" style="background-color: var(--bg-subtle); border-color: var(--border-subtle); color: var(--text-secondary)">${title}</span>`;
}

function emitCollectionPanelItem(
  item: Record<string, unknown>,
  ctx: EmitContext,
  levelOffset: number
): string {
  const title = item.title
    ? `<div class="font-semibold text-sm" style="color: var(--text-main)">${formatPlain(ctx, item.title)}</div>`
    : "";
  const desc = item.description
    ? `<p class="text-xs" style="color: var(--text-secondary)">${formatRichHtml(ctx, item.description)}</p>`
    : "";
  const children = Array.isArray(item.children)
    ? `<div class="p-3.5 rounded-lg border border-dashed text-xs space-y-2" style="background-color: var(--bg-subtle); border-color: var(--border-color); color: var(--text-secondary)">${emitChildren(asBlocks(item.children), ctx, levelOffset)}</div>`
    : "";
  return `<div class="${THREE_COLUMN_ITEM_CLASS} space-y-2" data-collection-item="true">${title}${desc}${children}</div>`;
}

function emitCollectionCompactItem(
  item: Record<string, unknown>,
  ctx: EmitContext
): string {
  const title = item.title ? formatPlain(ctx, item.title) : "";
  const value =
    item.value == null ? "" : escapeHtml(String(item.value)).toUpperCase();
  const valueHtml = value
    ? `<span class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase px-2 py-0.5 rounded border" style="background-color: var(--bg-subtle); border-color: var(--border-subtle)">${value}</span>`
    : "";
  return `<div class="${THREE_COLUMN_ITEM_CLASS} p-4 rounded-xl border flex items-center justify-between gap-3" style="background-color: var(--bg-surface); border-color: var(--border-color)" data-collection-item="true"><span class="text-sm font-medium" style="color: var(--text-main)">${title}</span>${valueHtml}</div>`;
}

function emitCollectionCardItem(
  item: Record<string, unknown>,
  ctx: EmitContext
): string {
  const title = item.title
    ? `<div class="font-medium text-sm" style="color: var(--text-main)">${formatPlain(ctx, item.title)}</div>`
    : "";
  const desc = item.description
    ? `<div class="text-xs mt-1" style="color: var(--text-secondary)">${formatRichHtml(ctx, item.description)}</div>`
    : "";
  return `<div class="${THREE_COLUMN_ITEM_CLASS} p-4 rounded-xl border" style="background-color: var(--bg-surface); border-color: var(--border-color)" data-collection-item="true">${title}${desc}</div>`;
}

function emitCollectionStatItem(
  item: Record<string, unknown>,
  ctx: EmitContext
): string {
  const valuePlain = item.value == null ? "" : escapeHtml(String(item.value));
  const unit =
    item.unit == null
      ? ""
      : `<span class="text-xs font-mono" style="color: var(--text-muted)">${escapeHtml(String(ctx.t(item.unit as never)))}</span>`;
  const title = item.title
    ? `<span class="text-xs ml-2" style="color: var(--text-secondary)">(${formatPlain(ctx, item.title)})</span>`
    : "";
  const value =
    valuePlain.length === 0
      ? ""
      : `<span class="text-2xl font-bold font-mono" style="color: var(--text-main)" data-collection-value="true">${valuePlain}</span>`;
  return `<div class="${THREE_COLUMN_ITEM_CLASS} p-4 rounded-xl border flex items-baseline gap-2" style="background-color: var(--bg-surface); border-color: var(--border-color)" data-collection-item="true">${value}${unit}${title}</div>`;
}

const COLLECTION_SURFACE =
  "background-color: var(--bg-surface); border-color: var(--border-color)";

const emitCollection: EmitHandler = (block, ctx, levelOffset = 0) => {
  const variant = typeof block.variant === "string" ? block.variant : "card";
  const items = asBlocks(block.items).filter(
    (raw): raw is Record<string, unknown> =>
      Boolean(raw && typeof raw === "object")
  );
  const variantAttr = `data-variant="${attr(variant)}"`;
  const tiledVariantAttr = `${variantAttr} data-max-columns="3"`;

  if (variant === "metric") {
    const grid = `<div class="flex flex-wrap gap-4" data-collection-grid="true" data-max-columns="3">${items.map((item) => emitCollectionMetricItem(item, ctx)).join("")}</div>`;
    return wrapBlock("collection", grid, {
      attrs: tiledVariantAttr,
      className: "p-5 rounded-xl border space-y-4",
      style: COLLECTION_SURFACE,
    });
  }

  if (variant === "chip") {
    const chips = `<div class="flex flex-wrap gap-2" data-collection-chips="true">${items.map((item) => emitCollectionChipItem(item, ctx)).join("")}</div>`;
    return wrapBlock("collection", chips, {
      attrs: variantAttr,
      className: "p-4 rounded-xl border",
      style: COLLECTION_SURFACE,
    });
  }

  if (variant === "panel") {
    const body = `<div class="flex flex-wrap gap-4" data-collection-panels="true" data-max-columns="3">${items.map((item) => emitCollectionPanelItem(item, ctx, levelOffset)).join("")}</div>`;
    return wrapBlock("collection", body, {
      attrs: tiledVariantAttr,
      className: "p-5 rounded-xl border space-y-3",
      style: COLLECTION_SURFACE,
    });
  }

  if (variant === "compact") {
    return wrapBlock(
      "collection",
      items.map((item) => emitCollectionCompactItem(item, ctx)).join(""),
      {
        attrs: tiledVariantAttr,
        className: "flex flex-wrap gap-4",
      }
    );
  }

  if (variant === "stat") {
    return wrapBlock(
      "collection",
      items.map((item) => emitCollectionStatItem(item, ctx)).join(""),
      {
        attrs: tiledVariantAttr,
        className: "flex flex-wrap gap-4",
      }
    );
  }

  return wrapBlock(
    "collection",
    items.map((item) => emitCollectionCardItem(item, ctx)).join(""),
    {
      attrs: tiledVariantAttr,
      className: "flex flex-wrap gap-4",
    }
  );
};

function badgeTone(badge: { status?: string; tone?: string }): string {
  if (typeof badge.tone === "string") {
    return badge.tone;
  }
  return "neutral";
}

function metricDeltaIcon(text: string, status?: string): string {
  const lower = `${text} ${status ?? ""}`.toLowerCase();
  let name: IconName = "trending-up";
  if (
    lower.includes("pass") ||
    lower.includes("通过") ||
    lower.includes("ok") ||
    lower.includes("done")
  ) {
    name = "circle-check";
  } else if (
    METRIC_DELTA_NEGATIVE.test(text) ||
    lower.includes("降低") ||
    lower.includes("下降") ||
    lower.includes("p99")
  ) {
    name = lower.includes("p99") ? "arrow-down-right" : "trending-down";
  }
  return renderIcon(name, { className: "size-3 shrink-0" });
}

function emitHeroBadge(
  badge: { label: unknown; status?: string; tone?: string },
  ctx: EmitContext
): string {
  const labelText = String(ctx.t(loc(badge.label)));
  if (typeof badge.status === "string" && badge.status.length > 0) {
    return renderStatusBadge(badge.status, { label: labelText });
  }
  return renderAccentBadge(labelText, { tone: badgeTone(badge) });
}

function emitMetricCard(
  metric: Record<string, unknown>,
  ctx: EmitContext
): string {
  const tone = typeof metric.tone === "string" ? metric.tone : undefined;
  const status = typeof metric.status === "string" ? metric.status : undefined;
  const titlePlain = metric.title ? formatPlain(ctx, metric.title) : "";
  const title =
    titlePlain.length > 0
      ? `<div class="text-xs mb-1" style="color: var(--text-secondary)">${titlePlain}</div>`
      : "";
  const value = emitMetricValueRow(
    { tone, status, unit: metric.unit, value: metric.value },
    ctx,
    {
      dataAttr: 'data-metric-number="true"',
      valueClassExtra: "sm:text-3xl",
    }
  );
  let footer = "";
  if (metric.delta) {
    const deltaText = formatPlain(ctx, metric.delta);
    footer = `<div class="mt-3 pt-2 border-t text-[11px] flex items-center justify-between" data-metric-delta="true" style="border-color: var(--border-color)"><span style="color: var(--text-muted)">${deltaText}</span>${metricDeltaIcon(deltaText)}</div>`;
  } else if (metric.status) {
    const statusText = escapeHtml(String(metric.status));
    footer = `<div class="mt-3 pt-2 border-t text-[11px] flex items-center justify-between gap-2" data-metric-delta="true" data-status="${attr(String(metric.status))}" style="border-color: var(--border-color)">${metricDeltaIcon(statusText, String(metric.status))}${renderStatusBadge(String(metric.status), { scale: "90" })}</div>`;
  } else if (metric.description) {
    footer = `<div class="mt-3 pt-2 border-t text-[11px]" data-metric-desc="true" style="border-color: var(--border-color); color: var(--text-muted)">${formatRichHtml(ctx, metric.description)}</div>`;
  }
  const toneAttr = tone ? ` data-tone="${attr(tone)}"` : "";
  return `<div class="min-w-0 flex-1 basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)] p-4 rounded-xl border flex flex-col justify-between" style="background-color: var(--bg-subtle); border-color: var(--border-subtle)" data-metric="true"${toneAttr}><div data-metric-body="true">${title}${value}</div>${footer}</div>`;
}

const emitHero: EmitHandler = (block, ctx) => {
  const badgeItems = asBlocks(block.badges)
    .map((b) =>
      emitHeroBadge(
        b as { label: unknown; status?: string; tone?: string },
        ctx
      )
    )
    .join("");
  const metrics = asBlocks(block.metrics)
    .filter((m): m is Record<string, unknown> =>
      Boolean(m && typeof m === "object")
    )
    .map((metric) => emitMetricCard(metric, ctx))
    .join("");
  const label = escapeHtml(
    htmlLocaleMessage("emit.hero-chrome-label", ctx.locale)
  );
  const chrome = `<div class="flex flex-wrap items-center justify-between gap-3 mb-6" data-hero-chrome="true"><div class="flex items-center gap-2" data-hero-chrome-leading="true"><span class="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" data-hero-pulse="true" aria-hidden="true"></span><span class="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 font-mono" data-hero-label="true">${label}</span></div><div class="flex items-center gap-2 flex-wrap" data-hero-badges="true">${badgeItems}</div></div>`;
  return wrapBlock(
    "hero",
    `${chrome}<div class="flex flex-wrap gap-4" data-hero-metrics="true">${metrics}</div>`,
    {
      className: "p-4 sm:p-7 rounded-2xl border transition-all",
      style:
        "background-color: var(--bg-surface); border-color: var(--border-color)",
      tag: "section",
    }
  );
};

const emitSection: EmitHandler = (block, ctx, levelOffset) => {
  const sectionLevel = typeof block.level === "number" ? block.level : 2;
  const titleText = ctx.t(block.title as never);
  const sectionId = sectionAnchorFor(ctx.schemaVersion)(ctx, block, titleText);
  ctx.tocEntries.push({
    id: sectionId,
    level: sectionLevel,
    title: titleText,
  });
  const headingLevel = sectionHeadingLevel(sectionLevel);
  const titleHtml = headingTag(headingLevel, titleText, {
    className: sectionTitleClass(sectionLevel),
    splitOrdinal: false,
    style: "color: var(--text-main)",
  });
  const leadHtml = block.lead
    ? `<p class="mt-2 text-sm sm:text-base leading-relaxed" data-lead="true" style="color: var(--text-secondary)">${formatRichHtml(ctx, block.lead)}</p>`
    : "";

  let header: string;
  if (sectionLevel <= 1) {
    header = `<div class="border-b pb-3" data-section-header="true" style="border-color: var(--border-color)"><div class="flex items-center gap-2">${titleHtml}</div>${leadHtml}</div>`;
  } else if (sectionLevel >= 4) {
    header = `<div class="flex items-center gap-2 mb-1" data-section-header="true">${titleHtml}</div>${leadHtml}`;
  } else {
    header = `<div class="flex items-center gap-2" data-section-header="true">${titleHtml}</div>${leadHtml}`;
  }

  const children = emitChildren(
    asBlocks(block.children),
    childHeadingCtx(ctx, headingLevel),
    levelOffset
  );
  const inner = `${header}${children}`;

  if (sectionLevel <= 1) {
    const isFirst = ctx.topSectionCount === 0;
    ctx.topSectionCount += 1;
    return wrapBlock("section", inner, {
      className: isFirst ? "space-y-8 pt-4" : "space-y-8 pt-6 border-t",
      id: sectionId,
      style: isFirst ? undefined : "border-color: var(--border-color)",
      tag: "section",
    });
  }
  if (sectionLevel >= 4) {
    return wrapBlock("section", inner, {
      className: "p-3.5 rounded-lg border border-dashed",
      id: sectionId,
      style:
        "background-color: var(--bg-subtle); border-color: var(--border-color)",
      tag: "section",
    });
  }
  return wrapBlock("section", inner, {
    className: "space-y-6 pl-0 border-transparent",
    id: sectionId,
    tag: "section",
  });
};

const emitGroup: EmitHandler = (block, ctx, levelOffset) => {
  const hasTitle = Boolean(block.title);
  const title = hasTitle
    ? `<div class="flex items-center justify-between border-b pb-2" data-group-chrome="true" style="border-color: var(--border-subtle)"><span class="text-xs font-semibold uppercase tracking-wider font-mono" style="color: var(--text-secondary)">${formatPlain(ctx, block.title)}</span></div>`
    : "";
  const childCtx = hasTitle ? childHeadingCtx(ctx, ctx.headingLevel) : ctx;
  const inner = `${title}${emitChildren(asBlocks(block.children), childCtx, levelOffset)}`;
  return wrapBlock("group", inner, {
    className: "p-4 sm:p-5 rounded-xl border space-y-4",
    style:
      "background-color: var(--bg-surface); border-color: var(--border-color)",
  });
};

const emitDivider: EmitHandler = (block, ctx) => {
  const label = block.label
    ? `<div class="relative px-4 text-xs font-mono font-medium rounded-full border" data-divider-label="true" style="background-color: var(--bg-surface); color: var(--text-muted); border-color: var(--border-color)">${formatPlain(ctx, block.label)}</div>`
    : "";
  const inner = `<div class="absolute inset-0 flex items-center"><div class="w-full border-t" style="border-color: var(--border-color)"></div></div>${label}`;
  return wrapBlock("divider", inner, {
    className: "relative py-4 flex items-center justify-center",
  });
};

const SPACER_SIZE_CLASS: Record<string, string> = {
  sm: "h-3",
  md: "h-6",
  lg: "h-10",
};

const emitSpacer: EmitHandler = (block) => {
  const size = typeof block.size === "string" ? block.size : "md";
  const sizeClass = SPACER_SIZE_CLASS[size] ?? SPACER_SIZE_CLASS.md;
  return wrapBlock(
    "spacer",
    `<div class="${sizeClass} bg-slate-200/50 dark:bg-slate-800/50 rounded flex items-center justify-center" aria-hidden="true"></div>`,
    {
      attrs: `data-spacer-size="${attr(size)}"`,
      className: "py-1 text-[11px] font-mono text-center",
      style: "color: var(--text-muted)",
    }
  );
};

const emitHeading: EmitHandler = (block, ctx, levelOffset) => {
  const level =
    (typeof block.level === "number" ? block.level : 2) + levelOffset;
  const title = headingTag(level, ctx.t(block.text as never), {
    className: headingBlockClass(level),
    style: headingBlockStyle(level),
  });
  return wrapBlock("heading", title, {
    className: "space-y-2",
  });
};

const emitParagraph: EmitHandler = (block, ctx) =>
  wrapBlock("paragraph", formatRichHtml(ctx, block.text), {
    className: "leading-relaxed text-sm sm:text-base [overflow-wrap:anywhere]",
    style: "color: var(--text-secondary)",
    tag: "p",
  });

const emitLead: EmitHandler = (block, ctx) =>
  wrapBlock("lead", formatRichHtml(ctx, block.text), {
    attrs: 'data-lead="true"',
    className:
      "p-4 rounded-xl border-l-4 border-sky-500 leading-relaxed text-sm sm:text-base",
    style:
      "background-color: var(--bg-surface); color: var(--text-main); border-color: var(--link)",
  });

const emitPullQuote: EmitHandler = (block, ctx) => {
  let inner = `<p class="text-lg sm:text-xl font-serif italic font-medium leading-relaxed" style="color: var(--text-main)">${formatPlain(ctx, block.text)}</p>`;
  if (block.attribution) {
    inner += `<div class="text-xs font-medium tracking-wide uppercase font-mono text-sky-600 dark:text-sky-400" data-pull-quote-attribution="true">— ${formatPlain(ctx, block.attribution)}</div>`;
  }
  return wrapBlock("pullQuote", inner, {
    className: "my-6 p-6 rounded-xl border text-center space-y-3",
    style:
      "background-color: var(--bg-surface); border-color: var(--border-color)",
  });
};

const emitBlockquote: EmitHandler = (block, ctx) =>
  wrapBlock("blockquote", formatRichHtml(ctx, block.text), {
    className:
      "p-4 border-l-4 rounded-r-lg italic text-sm sm:text-base leading-relaxed",
    style:
      "border-color: var(--text-muted); background-color: var(--bg-subtle); color: var(--text-secondary)",
    tag: "blockquote",
  });

const CALLOUT_ICONS: Record<string, IconName> = {
  info: "info",
  tip: "lightbulb",
  success: "circle-check",
  warning: "triangle-alert",
  danger: "shield-alert",
};

const CALLOUT_FRAME: Record<string, string> = {
  info: "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 text-blue-900 dark:text-blue-200",
  tip: "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200",
  success:
    "bg-teal-50/70 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/60 text-teal-900 dark:text-teal-200",
  warning:
    "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200",
  danger:
    "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200",
};

const CALLOUT_ACCENT: Record<string, string> = {
  info: "text-blue-600 dark:text-blue-400",
  tip: "text-emerald-600 dark:text-emerald-400",
  success: "text-teal-600 dark:text-teal-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-rose-600 dark:text-rose-400",
};

const emitCallout: EmitHandler = (block, ctx) => {
  const variant = typeof block.variant === "string" ? block.variant : "info";
  const iconName = CALLOUT_ICONS[variant] ?? "info";
  const frame = CALLOUT_FRAME[variant] ?? CALLOUT_FRAME.info ?? "";
  const accent = CALLOUT_ACCENT[variant] ?? CALLOUT_ACCENT.info ?? "";
  const title = block.title
    ? `<strong class="font-semibold block mb-0.5">${formatPlain(ctx, block.title)}</strong>`
    : "";
  const body = formatRichHtml(ctx, block.body);
  const inner = `${renderIcon(iconName, { className: `w-5 h-5 mt-0.5 flex-shrink-0 ${accent}` })}<div class="text-xs sm:text-sm min-w-0 flex-1">${title}${body}</div>`;
  return wrapBlock("callout", inner, {
    attrs: `data-variant="${attr(variant)}"`,
    className: `flex items-start gap-3 p-4 rounded-xl border ${frame}`,
  });
};

const emitBulletList: EmitHandler = (block, ctx) =>
  wrapBlock(
    "bulletList",
    asBlocks(block.items)
      .map((item) => `<li>${formatRichHtml(ctx, item)}</li>`)
      .join(""),
    {
      className:
        "p-4 rounded-xl border space-y-2.5 text-xs sm:text-sm list-disc pl-8",
      style:
        "background-color: var(--bg-surface); border-color: var(--border-color); color: var(--text-secondary)",
      tag: "ul",
    }
  );

const emitNumberedList: EmitHandler = (block, ctx) =>
  wrapBlock(
    "numberedList",
    asBlocks(block.items)
      .map((item) => `<li>${formatRichHtml(ctx, item)}</li>`)
      .join(""),
    {
      className:
        "p-4 rounded-xl border space-y-2.5 text-xs sm:text-sm list-decimal pl-8",
      style:
        "background-color: var(--bg-surface); border-color: var(--border-color); color: var(--text-secondary)",
      tag: "ol",
    }
  );

const emitChecklist: EmitHandler = (block, ctx) =>
  wrapBlock(
    "checklist",
    asBlocks(block.items)
      .map((raw) => {
        const item = raw as {
          checked?: boolean;
          label: unknown;
          note?: unknown;
          status?: string;
        };
        const checked = item.checked ? "true" : "false";
        const labelClass = item.checked
          ? "text-xs sm:text-sm font-medium line-through opacity-80"
          : "text-xs sm:text-sm font-medium";
        const note = item.note
          ? `<div class="text-[11px] mt-0.5" data-check-note="true" style="color: var(--text-muted)">${formatRichHtml(ctx, item.note)}</div>`
          : "";
        const status =
          typeof item.status === "string" && item.status.length > 0
            ? renderStatusBadge(item.status, { scale: "90" })
            : "";
        return `<div class="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3" data-checked="${checked}"><div class="flex min-w-0 items-start gap-3"><input type="checkbox" class="mt-1 rounded text-sky-600 dark:text-sky-400 focus:ring-sky-500 border-slate-300 dark:border-slate-600 shrink-0" disabled${item.checked ? " checked" : ""} /><div class="min-w-0 [overflow-wrap:anywhere]"><div class="${labelClass}" data-check-label="true" style="color: var(--text-main)">${formatRichHtml(ctx, item.label)}</div>${note}</div></div>${status}</div>`;
      })
      .join(""),
    {
      attrs: 'data-checklist="true"',
      className: "p-4 rounded-xl border divide-y",
      style:
        "background-color: var(--bg-surface); border-color: var(--border-color)",
    }
  );

const emitDefinitionList: EmitHandler = (block, ctx) =>
  wrapBlock(
    "definitionList",
    asBlocks(block.items)
      .map((raw) => {
        const item = raw as { definition: unknown; term: unknown };
        return `<div class="p-3.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4"><dt class="font-mono font-bold text-xs sm:w-28 text-sky-600 dark:text-sky-400 flex-shrink-0">${formatPlain(ctx, loc(item.term))}</dt><dd class="text-xs leading-relaxed" style="color: var(--text-secondary)">${formatRichHtml(ctx, item.definition)}</dd></div>`;
      })
      .join(""),
    {
      className: "rounded-xl border divide-y overflow-hidden",
      style:
        "background-color: var(--bg-surface); border-color: var(--border-color)",
    }
  );

const emitTable: EmitHandler = (block, ctx) => {
  const cols = asBlocks(block.columns) as { key: string; label: unknown }[];
  const header = cols
    .map(
      (c) =>
        `<th class="py-2.5 px-4" scope="col">${formatPlain(ctx, loc(c.label))}</th>`
    )
    .join("");
  const bodyRows = asBlocks(block.rows)
    .map((row) => {
      const record = row as Record<string, unknown>;
      const cells = cols
        .map(
          (c) =>
            `<td class="py-2.5 px-4">${cellTextHtml(record[c.key], ctx)}</td>`
        )
        .join("");
      return `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">${cells}</tr>`;
    })
    .join("");
  let inner = `<table class="w-full text-left text-xs sm:text-sm border-collapse">`;
  if (block.caption) {
    inner += `<caption class="text-left font-semibold text-xs p-3 border-b" style="border-color: var(--border-subtle); color: var(--text-secondary); background-color: var(--bg-subtle)">${formatPlain(ctx, block.caption)}</caption>`;
  }
  inner += `<thead><tr class="border-b font-mono font-medium bg-slate-50 text-slate-600 dark:bg-slate-900/40 dark:text-slate-300" style="border-color: var(--border-color)">${header}</tr></thead><tbody class="divide-y" style="border-color: var(--border-color); color: var(--text-secondary)">${bodyRows}</tbody>`;
  if (block.footerRow && typeof block.footerRow === "object") {
    const footerRow = block.footerRow as Record<string, unknown>;
    const footerCells = cols
      .map(
        (c) =>
          `<td class="py-2.5 px-4">${cellTextHtml(footerRow[c.key], ctx)}</td>`
      )
      .join("");
    inner += `<tfoot><tr class="border-t font-medium" style="border-color: var(--border-color); background-color: var(--bg-subtle)">${footerCells}</tr></tfoot>`;
  }
  inner += "</table>";
  return wrapBlock("table", inner, {
    className: "overflow-x-auto rounded-xl border",
    style:
      "background-color: var(--bg-surface); border-color: var(--border-color)",
  });
};

const emitComparison: EmitHandler = (block, ctx, levelOffset) => {
  const beforeLabel = block.labelBefore
    ? ctx.t(block.labelBefore as never)
    : htmlLocaleMessage("emit.comparison-before", ctx.locale);
  const afterLabel = block.labelAfter
    ? ctx.t(block.labelAfter as never)
    : htmlLocaleMessage("emit.comparison-after", ctx.locale);
  const beforeRows = extractBulletListRows(asBlocks(block.before), ctx);
  const afterRows = extractBulletListRows(asBlocks(block.after), ctx);

  const side = (
    sideKey: "before" | "after",
    label: string,
    rows: string[] | null,
    blocks: unknown[],
    tone: "rose" | "emerald"
  ): string => {
    const toneClass =
      tone === "rose"
        ? "border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10"
        : "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10";
    const labelTone =
      tone === "rose"
        ? "text-rose-700 dark:text-rose-400 border-red-200 dark:border-red-900/40"
        : "text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40";
    let body: string;
    if (rows) {
      body = `<ul class="space-y-1.5 text-xs" style="color: var(--text-secondary)">${rows.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>`;
    } else {
      body = emitChildren(blocks, ctx, levelOffset);
    }
    return `<div class="p-4 rounded-lg border ${toneClass}" data-comparison-side="${sideKey}"><div class="flex items-center gap-2 pb-2 mb-3 border-b font-semibold text-xs uppercase tracking-wider font-mono ${labelTone}">${escapeHtml(label)}</div>${body}</div>`;
  };

  const inner = `${side("before", beforeLabel, beforeRows, asBlocks(block.before), "rose")}${side("after", afterLabel, afterRows, asBlocks(block.after), "emerald")}`;
  return wrapBlock("comparison", inner, {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border p-4",
    style:
      "background-color: var(--bg-surface); border-color: var(--border-color)",
  });
};

const KV_SURFACE =
  "background-color: var(--bg-surface); border-color: var(--border-color)";

/** Inline/stacked grids: at most 3 equal-width columns per row. */
/** At most 3 equal-width items per row; leftover items share the last row. */
function keyValueEqualRowClass(): string {
  return "flex flex-wrap gap-4";
}

function keyValueEqualItemClass(): string {
  // basis ~1/3 so a row caps at 3; flex-1 shares leftover width evenly.
  return "min-w-0 flex-1 basis-full sm:basis-[calc(33.333%-0.67rem)]";
}

function emitKeyValueInline(
  items: { key: unknown; value: unknown }[],
  ctx: EmitContext
): string {
  const cells = items
    .map((item) => {
      return `<div class="${keyValueEqualItemClass()}" data-kv-item="true"><span class="block text-xs mb-0.5" style="color: var(--text-muted)">${formatPlain(ctx, loc(item.key))}</span><span class="text-xs font-medium [overflow-wrap:anywhere]" style="color: var(--text-main)">${formatRichHtml(ctx, item.value)}</span></div>`;
    })
    .join("");
  return `<div class="${keyValueEqualRowClass()}" data-kv-grid="true">${cells}</div>`;
}

function emitKeyValueStacked(
  items: { key: unknown; value: unknown }[],
  ctx: EmitContext
): string {
  const cards = items
    .map((item) => {
      return `<div class="${keyValueEqualItemClass()} p-3 rounded-lg border" style="background-color: var(--bg-subtle); border-color: var(--border-subtle)" data-kv-item="true"><div class="text-xs font-semibold mb-1" style="color: var(--text-main)">${formatPlain(ctx, loc(item.key))}</div><div class="text-xs [overflow-wrap:anywhere]" style="color: var(--text-secondary)">${formatRichHtml(ctx, item.value)}</div></div>`;
    })
    .join("");
  return `<div class="${keyValueEqualRowClass()}" data-kv-grid="true">${cards}</div>`;
}

function emitKeyValueRows(
  items: { key: unknown; value: unknown }[],
  ctx: EmitContext
): string {
  return items
    .map((item, index) => {
      const isLast = index === items.length - 1;
      const borderClass = isLast ? "" : " border-b";
      const borderStyle = isLast
        ? ""
        : ' style="border-color: var(--border-subtle)"';
      return `<div class="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 text-xs py-1${borderClass}"${borderStyle} data-kv-item="true"><span style="color: var(--text-secondary)">${formatPlain(ctx, loc(item.key))}</span><span class="min-w-0 [overflow-wrap:anywhere]" style="color: var(--text-main)">${formatRichHtml(ctx, item.value)}</span></div>`;
    })
    .join("");
}

const emitKeyValueList: EmitHandler = (block, ctx) => {
  const layout = typeof block.layout === "string" ? block.layout : "auto";
  const items = asBlocks(block.items).map(
    (raw) => raw as { key: unknown; value: unknown }
  );

  if (layout === "inline") {
    return wrapBlock("keyValueList", emitKeyValueInline(items, ctx), {
      attrs: 'data-layout="inline"',
      className: "p-4 rounded-xl border",
      style: KV_SURFACE,
    });
  }

  if (layout === "stacked") {
    return wrapBlock("keyValueList", emitKeyValueStacked(items, ctx), {
      attrs: 'data-layout="stacked"',
      className: "p-4 rounded-xl border",
      style: KV_SURFACE,
    });
  }

  // auto: few items → compact rows; more → stacked cards
  if (items.length <= 3) {
    return wrapBlock("keyValueList", emitKeyValueRows(items, ctx), {
      attrs: 'data-layout="auto"',
      className: "p-4 rounded-xl border space-y-2",
      style: KV_SURFACE,
    });
  }

  return wrapBlock("keyValueList", emitKeyValueStacked(items, ctx), {
    attrs: 'data-layout="auto"',
    className: "p-4 rounded-xl border",
    style: KV_SURFACE,
  });
};

const emitStatusBoard: EmitHandler = (block, ctx) =>
  wrapBlock(
    "statusBoard",
    `<div class="flex flex-wrap gap-3" data-status-board="true" data-max-columns="3">${asBlocks(
      block.items
    )
      .map((raw) => {
        const item = raw as {
          detail?: unknown;
          label: unknown;
          status: string;
        };
        const detail = item.detail
          ? `<div class="text-[11px]" data-status-board-detail="true" style="color: var(--text-muted)">${formatRichHtml(ctx, item.detail)}</div>`
          : "";
        return `<div class="${THREE_COLUMN_ITEM_CLASS} p-3 rounded-lg border flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-3" data-status-board-item="true" style="background-color: var(--bg-subtle); border-color: var(--border-subtle)"><div class="min-w-0 [overflow-wrap:anywhere]" data-status-board-copy="true"><div class="text-xs font-medium" data-status-board-label="true" style="color: var(--text-main)">${formatPlain(ctx, loc(item.label))}</div>${detail}</div>${renderStatusBadge(item.status)}</div>`;
      })
      .join("")}</div>`,
    {
      className: "p-4 rounded-xl border",
      style:
        "background-color: var(--bg-surface); border-color: var(--border-color)",
    }
  );

const emitCode: EmitHandler = (block, ctx) => {
  const lang = typeof block.language === "string" ? block.language : undefined;
  const code = String(block.code ?? "");
  const highlighted = ctx.takeHighlightedCode?.();
  const bodyHtml =
    typeof highlighted === "string" && highlighted.length > 0
      ? highlighted
      : renderPlainCodePre(code, lang);
  const filename =
    typeof block.filename === "string" ? block.filename : undefined;
  return wrapBlock(
    "code",
    renderCodeShell({ bodyHtml, filename, language: lang }),
    {
      attrs: 'data-code-block="true"',
      className: "rounded-xl border overflow-hidden font-mono text-xs",
      style:
        "background-color: var(--code-bg); border-color: var(--code-border)",
    }
  );
};

const CODE_DIFF_ROOT_CLASS =
  "rounded-xl border overflow-hidden font-mono text-xs";
const CODE_DIFF_ROOT_STYLE =
  "background-color: var(--code-bg); border-color: var(--code-border)";

const emitCodeDiff: EmitHandler = (block, ctx) => {
  const filename =
    typeof block.filename === "string" ? block.filename : undefined;
  const language =
    typeof block.language === "string" ? block.language : undefined;

  if (typeof block.unified === "string") {
    const unified = block.unified;
    const highlighted = ctx.takeHighlightedCode?.();
    const bodyHtml =
      typeof highlighted === "string" && highlighted.length > 0
        ? highlighted
        : renderPlainCodePre(unified, "diff");
    const stats = countUnifiedDiffStats(unified);
    const chrome = renderCodeDiffUnifiedChrome({
      filename,
      language,
      added: stats.added,
      deleted: stats.deleted,
    });
    return wrapBlock(
      "codeDiff",
      `${chrome}<div class="p-3 overflow-x-auto text-[11px] leading-5">${bodyHtml}</div>`,
      {
        attrs: 'data-code-block="true" data-code-diff="unified"',
        className: CODE_DIFF_ROOT_CLASS,
        style: CODE_DIFF_ROOT_STYLE,
      }
    );
  }

  const before = typeof block.before === "string" ? block.before : "";
  const after = typeof block.after === "string" ? block.after : "";
  const chrome = renderCodeDiffSplitChrome({ filename, language });
  const body = renderCodeDiffSplitBody({
    before,
    after,
    locale: ctx.locale,
  });
  return wrapBlock("codeDiff", `${chrome}${body}`, {
    attrs: 'data-code-block="true" data-code-diff="split"',
    className: CODE_DIFF_ROOT_CLASS,
    style: CODE_DIFF_ROOT_STYLE,
  });
};

const FILE_CHANGE_VISUAL: Record<
  string,
  "pass" | "warning" | "fail" | "neutral"
> = {
  added: "pass",
  modified: "warning",
  deleted: "fail",
  renamed: "neutral",
};

const TREE_INDENT_CLASS = [
  "",
  "pl-6",
  "pl-12",
  "pl-16",
  "pl-20",
  "pl-24",
] as const;

interface FileTreeNode {
  annotation?: unknown;
  change?: string;
  children?: unknown[];
  name: string;
}

function fileChangeBadge(change: string): string {
  const visual = FILE_CHANGE_VISUAL[change] ?? "neutral";
  return renderStatusBadge(visual, { label: change, scale: "90" });
}

function fileTreeNameStyle(deleted: boolean, isDir: boolean): string {
  if (deleted) {
    return "";
  }
  if (isDir) {
    return ' style="color: var(--text-main)"';
  }
  return ' style="color: var(--text-secondary)"';
}

function emitFileTreeNodeRow(
  node: FileTreeNode,
  ctx: EmitContext,
  depth: number
): string {
  const indent =
    TREE_INDENT_CLASS[Math.min(depth, TREE_INDENT_CLASS.length - 1)] ?? "";
  const kids = Array.isArray(node.children)
    ? (node.children as FileTreeNode[])
    : null;
  const isDir = kids !== null;
  const change =
    typeof node.change === "string" && node.change.length > 0
      ? node.change
      : "unchanged";
  const deleted = change === "deleted";
  const nameText = isDir ? `${node.name}/` : node.name;
  const nameClass = deleted ? "text-rose-500 line-through" : "";
  const icon = renderIcon(isDir ? "folders" : "file-text", {
    className: "w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]",
  });
  let trailing = "";
  if (change !== "unchanged") {
    trailing = fileChangeBadge(change);
  } else if (node.annotation) {
    trailing = `<span class="text-[11px]" style="color: var(--text-muted)" data-file-tree-annotation="true">${formatPlain(ctx, node.annotation)}</span>`;
  }
  const row = `<div class="flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 py-0.5 px-1 rounded ${indent}" data-file-tree-node="true" data-change="${attr(change)}"><span class="flex items-center gap-2 ${nameClass}"${fileTreeNameStyle(deleted, isDir)}>${icon}<span data-file-tree-name="true">${escapeHtml(nameText)}</span></span>${trailing}</div>`;
  const nested =
    kids && kids.length > 0 ? emitFileTreeRows(kids, ctx, depth + 1) : "";
  return `${row}${nested}`;
}

function emitFileTreeRows(
  nodes: FileTreeNode[],
  ctx: EmitContext,
  depth: number
): string {
  return nodes.map((node) => emitFileTreeNodeRow(node, ctx, depth)).join("");
}

const emitFileTree: EmitHandler = (block, ctx) => {
  const root = block.root as FileTreeNode;
  const title = block.caption
    ? formatPlain(ctx, block.caption)
    : escapeHtml(root.name);
  const chrome = `<div class="flex items-center gap-2 mb-3 font-semibold pb-2 border-b" data-file-tree-chrome="true" style="color: var(--text-main); border-color: var(--border-color)">${renderIcon("folders", { className: "w-4 h-4 text-sky-500 shrink-0" })}<span data-file-tree-title="true">${title}</span></div>`;
  const nodes =
    Array.isArray(root.children) && root.children.length > 0
      ? (root.children as FileTreeNode[])
      : [root];
  const body = `<div class="space-y-1 pl-2 min-w-max" data-file-tree="true">${emitFileTreeRows(nodes, ctx, 0)}</div>`;
  return wrapBlock("fileTree", `${chrome}${body}`, {
    className: "p-4 rounded-xl border font-mono text-xs overflow-x-auto",
    style: "background-color: var(--bg-surface)",
  });
};

function fileChangeSizeCell(item: {
  change: string;
  sizeAfter?: string;
  sizeBefore?: string;
}): string {
  const before =
    typeof item.sizeBefore === "string" && item.sizeBefore.length > 0
      ? item.sizeBefore
      : null;
  const after =
    typeof item.sizeAfter === "string" && item.sizeAfter.length > 0
      ? item.sizeAfter
      : null;
  if (before && after) {
    return `<td class="py-2.5 px-4 text-right font-mono text-[11px]" style="color: var(--text-muted)">${escapeHtml(before)} → ${escapeHtml(after)}</td>`;
  }
  if (item.change === "deleted" && before) {
    return `<td class="py-2.5 px-4 text-right font-mono text-rose-500">-${escapeHtml(before)}</td>`;
  }
  if (item.change === "added" && after) {
    return `<td class="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">+${escapeHtml(after)}</td>`;
  }
  if (after) {
    return `<td class="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">${escapeHtml(after)}</td>`;
  }
  if (before) {
    return `<td class="py-2.5 px-4 text-right font-mono" style="color: var(--text-muted)">${escapeHtml(before)}</td>`;
  }
  return `<td class="py-2.5 px-4 text-right font-mono" style="color: var(--text-muted)">—</td>`;
}

const emitFileChangeList: EmitHandler = (block, ctx) => {
  const pathLabel = escapeHtml(
    htmlLocaleMessage("emit.file-change-path", ctx.locale)
  );
  const changeLabel = escapeHtml(
    htmlLocaleMessage("emit.file-change-type", ctx.locale)
  );
  const noteLabel = escapeHtml(
    htmlLocaleMessage("emit.file-change-note", ctx.locale)
  );
  const sizeLabel = escapeHtml(
    htmlLocaleMessage("emit.file-change-size", ctx.locale)
  );
  const rows = asBlocks(block.items)
    .map((raw) => {
      const item = raw as {
        change: string;
        note?: unknown;
        path: string;
        sizeAfter?: string;
        sizeBefore?: string;
      };
      const deleted = item.change === "deleted";
      const pathClass = deleted
        ? "py-2.5 px-4 font-mono text-rose-500"
        : "py-2.5 px-4 font-mono text-sky-600 dark:text-sky-400";
      const note = item.note
        ? formatRichHtml(ctx, item.note)
        : `<span style="color: var(--text-muted)">—</span>`;
      const visual = FILE_CHANGE_VISUAL[item.change] ?? "neutral";
      return `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40" data-file-change="${attr(item.change)}"><td class="${pathClass}">${escapeHtml(item.path)}</td><td class="py-2.5 px-4 text-center">${renderStatusBadge(visual, { label: item.change })}</td><td class="py-2.5 px-4">${note}</td>${fileChangeSizeCell(item)}</tr>`;
    })
    .join("");
  return wrapBlock(
    "fileChangeList",
    `<table class="w-full min-w-[40rem] text-left text-xs"><thead><tr class="border-b border-slate-200 font-mono font-medium bg-slate-50 text-slate-600 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700"><th class="py-2.5 px-4" scope="col">${pathLabel}</th><th class="py-2.5 px-4 text-center" scope="col">${changeLabel}</th><th class="py-2.5 px-4" scope="col">${noteLabel}</th><th class="py-2.5 px-4 text-right" scope="col">${sizeLabel}</th></tr></thead><tbody class="divide-y divide-slate-200 dark:divide-slate-700" style="color: var(--text-secondary)">${rows}</tbody></table>`,
    {
      className: "overflow-x-auto rounded-xl border",
      style: "background-color: var(--bg-surface)",
    }
  );
};

const emitMermaid: EmitHandler = (block, ctx) => {
  const title = block.title ? ctx.t(block.title as never) : undefined;
  return wrapBlock("mermaid", mermaidFigure(ctx, block, title), {
    attrs: 'data-mermaid="true"',
  });
};

function architectureToneBadge(label: string): string {
  return renderAccentBadge(label, { scale: "90" });
}

function emitArchitectureModuleCard(
  item: Record<string, unknown>,
  ctx: EmitContext
): string {
  const title = item.title ? formatPlain(ctx, item.title) : "";
  const desc = item.description
    ? `<p class="text-xs leading-relaxed" style="color: var(--text-secondary)">${formatRichHtml(ctx, item.description)}</p>`
    : "";
  let badge = "";
  if (typeof item.status === "string" && item.status.length > 0) {
    badge = renderStatusBadge(item.status, { scale: "90" });
  } else {
    const badges = asBlocks(item.badges) as {
      label: unknown;
      tone?: string;
    }[];
    const first = badges[0];
    if (first) {
      badge = architectureToneBadge(String(ctx.t(loc(first.label))));
    }
  }
  const accent = item.tone === "accent";
  const frame = accent
    ? "border-sky-200 bg-sky-50/20 dark:border-sky-800 dark:bg-sky-950/20"
    : "border-[var(--border-color)]";
  const titleClass = accent
    ? "font-semibold text-sm text-sky-900 dark:text-sky-200"
    : "font-semibold text-sm";
  const titleStyle = accent ? "" : ' style="color: var(--text-main)"';
  const borderTop = accent
    ? "border-sky-200 dark:border-sky-800"
    : "border-[var(--border-subtle)]";
  const styleAttr = accent
    ? ""
    : ' style="background-color: var(--bg-surface)"';
  let metaRow = "";
  if (item.meta && typeof item.meta === "object" && !Array.isArray(item.meta)) {
    const entries = Object.entries(item.meta as Record<string, string>);
    const first = entries[0];
    if (first) {
      const [key, value] = first;
      metaRow = `<div class="mt-4 pt-2 border-t ${borderTop} text-[11px] font-mono flex items-center justify-between" style="color: var(--text-muted)" data-architecture-meta="true"><span>${escapeHtml(key)}</span><span class="text-sky-600 dark:text-sky-400">${escapeHtml(String(value))}</span></div>`;
    }
  }
  return `<div class="${THREE_COLUMN_ITEM_CLASS} p-4 rounded-xl border ${frame} flex flex-col justify-between" data-architecture-module="true"${styleAttr}><div class="space-y-1.5"><div class="flex items-center justify-between gap-2"><span class="${titleClass}"${titleStyle}>${title}</span>${badge}</div>${desc}</div>${metaRow}</div>`;
}

const emitArchitectureOverview: EmitHandler = (block, ctx) => {
  let inner = "";
  const overview = block.overview as
    | { source?: string; title?: unknown }
    | undefined;
  if (overview?.source) {
    const title =
      overview.title == null ? undefined : ctx.t(overview.title as never);
    inner += mermaidFigure(ctx, overview as Record<string, unknown>, title);
  }
  const modules = asBlocks(block.modules).filter(
    (m): m is Record<string, unknown> => Boolean(m && typeof m === "object")
  );
  if (modules.length > 0) {
    inner += `<div class="flex flex-wrap gap-4" data-architecture-modules="true" data-max-columns="3">${modules
      .map((m) => emitArchitectureModuleCard(m, ctx))
      .join("")}</div>`;
  }
  return wrapBlock("architectureOverview", inner, {
    className: "space-y-4",
  });
};

const emitFlowSteps: EmitHandler = (block, ctx) => {
  const steps = asBlocks(block.steps);
  const cards = steps
    .map((raw, index) => {
      const step = raw as {
        description?: unknown;
        status?: string;
        title: unknown;
      };
      const title = stripLeadingOrdinal(ctx.t(loc(step.title)));
      const ordinal = String(index + 1).padStart(2, "0");
      const status =
        typeof step.status === "string" && step.status.length > 0
          ? renderStatusBadge(step.status, { scale: "75" })
          : "";
      const desc = step.description
        ? `<div class="text-[11px] mt-1" style="color: var(--text-muted)" data-step-desc="true">${formatRichHtml(ctx, step.description)}</div>`
        : "";
      const active = step.status === "in_progress" ? " border-sky-400" : "";
      return `<div class="${THREE_COLUMN_ITEM_CLASS} p-3 rounded-lg border${active} flex flex-col justify-between" data-flow-step="true" style="background-color: var(--bg-subtle); border-color: var(--border-color)"><div class="flex items-center justify-between mb-2"><span class="font-mono text-xs font-bold text-sky-600 dark:text-sky-400" data-step-ordinal="true">${ordinal}</span>${status}</div><div class="text-xs font-semibold" data-step-title="true" style="color: var(--text-main)">${escapeHtml(title)}</div>${desc}</div>`;
    })
    .join("");
  return wrapBlock(
    "flowSteps",
    `<div class="flex flex-wrap gap-3" data-flow-steps="true" data-max-columns="3">${cards}</div>`,
    {
      className: "p-4 rounded-xl border",
      style: "background-color: var(--bg-surface)",
    }
  );
};

const emitDecision: EmitHandler = (block, ctx) => {
  const statusKey = String(block.status ?? "");
  const visual = DECISION_STATUS_VISUAL[statusKey] ?? "neutral";
  const statusBadgeHtml = renderStatusBadge(visual, {
    label: htmlLocaleMessage(`emit.decision-status.${statusKey}`, ctx.locale),
  });
  let inner = `<div class="flex flex-wrap items-start sm:items-center justify-between gap-2 border-b pb-3" data-decision-header="true" style="border-color: var(--border-color)"><div class="flex min-w-0 items-start sm:items-center gap-2" data-decision-heading="true"><span class="min-w-0 font-bold text-sm [overflow-wrap:anywhere]" data-decision-title="true" style="color: var(--text-main)">${escapeHtml(ctx.t(block.title as never))}</span></div>${statusBadgeHtml}</div>`;
  if (block.context) {
    const contextLabel = escapeHtml(
      htmlLocaleMessage("emit.decision-context", ctx.locale)
    );
    inner += `<div class="text-xs leading-relaxed" data-decision-context="true" style="color: var(--text-secondary)"><strong>${contextLabel}</strong> ${formatRichHtml(ctx, block.context)}</div>`;
  }
  const options = asBlocks(block.options);
  if (options.length) {
    const prosLabel = escapeHtml(
      htmlLocaleMessage("emit.decision-pros", ctx.locale)
    );
    const consLabel = escapeHtml(
      htmlLocaleMessage("emit.decision-cons", ctx.locale)
    );
    inner += `<div class="flex flex-wrap gap-2 pt-1" data-decision-options="true" data-max-columns="3">${options
      .map((raw) => {
        const opt = raw as { cons?: unknown; label: unknown; pros?: unknown };
        let card = `<div class="${THREE_COLUMN_ITEM_CLASS} p-2.5 rounded-lg border space-y-1" data-decision-option="true" style="background-color: var(--bg-subtle); border-color: var(--border-color)"><div class="font-medium" data-option-label="true" style="color: var(--text-main)">${formatPlain(ctx, opt.label)}</div>`;
        if (opt.pros) {
          card += `<div class="text-[11px] text-emerald-600" data-option-pros="true"><span>${prosLabel}</span> ${formatRichHtml(ctx, opt.pros)}</div>`;
        }
        if (opt.cons) {
          card += `<div class="text-[11px] text-rose-600 dark:text-rose-400" data-option-cons="true"><span>${consLabel}</span> ${formatRichHtml(ctx, opt.cons)}</div>`;
        }
        card += "</div>";
        return card;
      })
      .join("")}</div>`;
  }
  if (block.chosen) {
    const chosenLabel = escapeHtml(
      htmlLocaleMessage("emit.decision-chosen", ctx.locale)
    );
    inner += `<div class="p-2.5 rounded-lg border border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200" data-decision-chosen="true"><strong>${chosenLabel}</strong> ${formatPlain(ctx, block.chosen)}</div>`;
  }
  if (block.rationale) {
    const rationaleLabel = escapeHtml(
      htmlLocaleMessage("emit.decision-rationale", ctx.locale)
    );
    inner += `<div class="text-xs" style="color: var(--text-secondary)" data-decision-rationale="true"><strong>${rationaleLabel}</strong> ${formatRichHtml(ctx, block.rationale)}</div>`;
  }
  return wrapBlock(
    "decision",
    `<div class="space-y-3 text-xs leading-relaxed">${inner}</div>`,
    {
      className: "p-5 rounded-xl border space-y-3",
      style: "background-color: var(--bg-surface)",
    }
  );
};

const RISK_SEVERITY_FRAME: Record<string, string> = {
  critical:
    "border-rose-200 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/20",
  high: "border-rose-200 bg-rose-50/30 dark:border-rose-900/40 dark:bg-rose-950/20",
  medium:
    "border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20",
  low: "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40",
};

const RISK_SEVERITY_TITLE: Record<string, string> = {
  critical: "text-rose-700 dark:text-rose-300",
  high: "text-rose-700 dark:text-rose-300",
  medium: "text-amber-700 dark:text-amber-300",
  low: "text-slate-700 dark:text-slate-200",
};

const RISK_SEVERITY_FOOTER: Record<string, string> = {
  critical:
    "border-rose-200 text-rose-800 dark:border-rose-900/40 dark:text-rose-300",
  high: "border-rose-200 text-rose-800 dark:border-rose-900/40 dark:text-rose-300",
  medium:
    "border-amber-200 text-amber-800 dark:border-amber-900/40 dark:text-amber-300",
  low: "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400",
};

const emitRisk: EmitHandler = (block, ctx) => {
  const severity =
    typeof block.severity === "string" ? block.severity : "medium";
  const likelihood =
    typeof block.likelihood === "string" ? block.likelihood : "";
  const statusKey =
    typeof block.status === "string" && block.status.length > 0
      ? block.status
      : null;
  let severityVisual: "fail" | "warning" | "neutral" = "neutral";
  if (severity === "critical" || severity === "high") {
    severityVisual = "fail";
  } else if (severity === "medium") {
    severityVisual = "warning";
  }
  const severityLabel = likelihood ? `${severity} / ${likelihood}` : severity;
  const badges: string[] = [
    renderStatusBadge(severityVisual, { label: severityLabel, scale: "90" }),
  ];
  if (statusKey) {
    const visual = RISK_STATUS_VISUAL[statusKey] ?? "neutral";
    badges.push(
      renderStatusBadge(visual, {
        label: htmlLocaleMessage(`emit.risk-status.${statusKey}`, ctx.locale),
        scale: "90",
      })
    );
  }
  const frame = RISK_SEVERITY_FRAME[severity] ?? RISK_SEVERITY_FRAME.medium;
  const titleTone = RISK_SEVERITY_TITLE[severity] ?? RISK_SEVERITY_TITLE.medium;
  const footerTone =
    RISK_SEVERITY_FOOTER[severity] ?? RISK_SEVERITY_FOOTER.medium;
  let inner = `<div class="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-2" data-governance-header="true"><span class="text-xs font-mono font-bold [overflow-wrap:anywhere] ${titleTone}" data-governance-title="true">${escapeHtml(ctx.t(block.title as never))}</span><div class="flex flex-wrap items-center gap-2" data-governance-badges="true">${badges.join("")}</div></div>`;
  if (block.description) {
    inner += `<div class="text-xs" style="color: var(--text-secondary)" data-governance-body="true">${formatRichHtml(ctx, block.description)}</div>`;
  }
  const owner =
    typeof block.owner === "string" && block.owner.length > 0
      ? `<span>owner: ${escapeHtml(block.owner)}</span>`
      : "";
  const mitigation = block.mitigation
    ? `<span data-governance-mitigation="true">mitigation: ${formatRichHtml(ctx, block.mitigation)}</span>`
    : "";
  if (owner || mitigation) {
    inner += `<div class="text-[11px] pt-1 border-t flex items-center justify-between gap-2 ${footerTone}">${owner}${mitigation}</div>`;
  }
  return wrapBlock("risk", inner, {
    attrs: `data-severity="${attr(severity)}"`,
    className: `p-4 rounded-xl border space-y-2 ${frame}`,
  });
};

const emitAssumption: EmitHandler = (block, ctx) => {
  const validated = block.validated === true;
  const badge = renderStatusBadge(validated ? "pass" : "fail", {
    label: htmlLocaleMessage(
      validated ? "emit.assumption-validated" : "emit.assumption-unvalidated",
      ctx.locale
    ),
    scale: "90",
  });
  return wrapBlock(
    "assumption",
    `<div class="text-xs" data-governance-body="true" style="color: var(--text-main)">${formatRichHtml(ctx, block.statement)}</div>${badge}`,
    {
      attrs: `data-validated="${validated ? "true" : "false"}"`,
      className:
        "p-3.5 rounded-xl border flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-3",
      style: "background-color: var(--bg-surface)",
    }
  );
};

const emitConstraint: EmitHandler = (block, ctx) => {
  const rigid = block.nonNegotiable !== false;
  const badge = rigid
    ? renderStatusBadge("done", {
        label: htmlLocaleMessage("emit.constraint-rigid", ctx.locale),
        scale: "90",
      })
    : "";
  const scope =
    typeof block.scope === "string" && block.scope.length > 0
      ? `<div class="text-[11px] font-mono text-sky-600 dark:text-sky-400" data-constraint-scope="true"><span>${escapeHtml(htmlLocaleMessage("emit.constraint-scope", ctx.locale))}: ${escapeHtml(block.scope)}</span></div>`
      : "";
  return wrapBlock(
    "constraint",
    `<div class="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-2"><span class="text-xs font-semibold text-sky-800 dark:text-sky-300 [overflow-wrap:anywhere]" data-governance-body="true">${formatRichHtml(ctx, block.rule)}</span>${badge}</div>${scope}`,
    {
      attrs: rigid ? 'data-rigid="true"' : undefined,
      className:
        "p-4 rounded-xl border border-sky-200 bg-sky-50/20 dark:border-sky-800 dark:bg-sky-950/20 space-y-1.5",
    }
  );
};

const emitOpenQuestion: EmitHandler = (block, ctx) => {
  const blocking = block.blocking === true;
  const badge = renderStatusBadge(blocking ? "fail" : "neutral", {
    label: htmlLocaleMessage(
      blocking
        ? "emit.open-question-blocking"
        : "emit.open-question-non-blocking",
      ctx.locale
    ),
    scale: "90",
  });
  const frame = blocking
    ? "border-rose-200 bg-rose-50/20 dark:border-rose-900/40 dark:bg-rose-950/20"
    : "border-[var(--border-color)]";
  const textTone = blocking ? "text-rose-700 dark:text-rose-300" : "";
  const textStyle = blocking ? "" : ' style="color: var(--text-main)"';
  return wrapBlock(
    "openQuestion",
    `<div class="text-xs font-medium ${textTone}" data-governance-body="true"${textStyle}>${formatRichHtml(ctx, block.question)}</div>${badge}`,
    {
      attrs: `data-blocking="${blocking ? "true" : "false"}"`,
      className: `p-3.5 rounded-lg border ${frame} flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-3`,
      style: blocking ? undefined : "background-color: var(--bg-surface)",
    }
  );
};

const emitTimeline: EmitHandler = (block, ctx) => {
  const events = asBlocks(block.events)
    .map((raw) => {
      const ev = raw as {
        date?: string;
        description?: unknown;
        status?: string;
        title: unknown;
      };
      const date = ev.date
        ? `<span class="font-mono font-bold text-xs" style="color: var(--text-main)">${escapeHtml(ev.date)}</span>`
        : "";
      const status =
        typeof ev.status === "string" && ev.status.length > 0
          ? renderStatusBadge(ev.status, { scale: "75" })
          : "";
      const desc = ev.description
        ? `<div class="text-xs mt-0.5" style="color: var(--text-secondary)" data-timeline-desc="true">${formatRichHtml(ctx, ev.description)}</div>`
        : "";
      const dotTone =
        ev.status === "done" || ev.status === "pass"
          ? "bg-emerald-500 ring-emerald-100 dark:ring-emerald-900/60"
          : "bg-sky-500 ring-sky-100 dark:ring-sky-900/60";
      return `<div class="relative flex items-start gap-4" data-timeline-event="true" data-event-status="${attr(ev.status ?? "neutral")}"><div class="w-4 h-4 rounded-full ${dotTone} ring-4 mt-1 flex-shrink-0 z-10" data-timeline-dot="true" aria-hidden="true"></div><div class="min-w-0 [overflow-wrap:anywhere]" data-timeline-body="true"><div class="flex flex-wrap items-center gap-2" data-timeline-meta="true">${date}${status}</div><div class="text-xs font-semibold mt-0.5" data-timeline-title="true" style="color: var(--text-main)">${formatPlain(ctx, loc(ev.title))}</div>${desc}</div></div>`;
    })
    .join("");
  return wrapBlock(
    "timeline",
    `<div class="absolute left-8 top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-700" aria-hidden="true"></div>${events}`,
    {
      attrs: 'data-timeline="true"',
      className: "p-5 rounded-xl border space-y-4 pl-6 relative",
      style:
        "background-color: var(--bg-surface); border-color: var(--border-color)",
    }
  );
};

function emitRoadmapPhaseCard(
  phase: {
    goals?: unknown[];
    status?: string;
    timeframe?: unknown;
    title: unknown;
  },
  ctx: EmitContext
): string {
  const status =
    typeof phase.status === "string" && phase.status.length > 0
      ? renderStatusBadge(phase.status, { scale: "75" })
      : "";
  const current = phase.status === "in_progress";
  const borderClass = current ? "border-sky-400" : "";
  const style = current
    ? "background-color: var(--bg-surface)"
    : "background-color: var(--bg-surface); border-color: var(--border-color)";
  const titleClass = current
    ? "font-semibold text-xs text-sky-600 dark:text-sky-400"
    : "font-semibold text-xs";
  const titleStyle = current ? "" : ' style="color: var(--text-main)"';
  const timeframeTone = current ? "text-sky-600 dark:text-sky-400" : "";
  const timeframeStyle = current
    ? "border-color: var(--border-subtle)"
    : "border-color: var(--border-subtle); color: var(--text-muted)";
  const timeframe = phase.timeframe
    ? `<div class="mt-3 pt-2 border-t font-mono text-[11px] ${timeframeTone}" data-phase-timeframe="true" style="${timeframeStyle}">${escapeHtml(ctx.t(loc(phase.timeframe)))}</div>`
    : "";
  let body = `<div class="flex items-center justify-between mb-2" data-phase-chrome="true"><span class="${titleClass}" data-phase-title="true"${titleStyle}>${escapeHtml(ctx.t(loc(phase.title)))}</span>${status}</div>`;
  if (phase.goals?.length) {
    body += `<ul class="text-xs space-y-1 pl-4 list-disc" style="color: var(--text-secondary)" data-phase-goals="true">${phase.goals.map((g) => `<li>${formatRichHtml(ctx, g)}</li>`).join("")}</ul>`;
  }
  return `<div class="${THREE_COLUMN_ITEM_CLASS} p-4 rounded-xl border flex flex-col justify-between ${borderClass}" data-roadmap-phase="true"${current ? ' data-current="true"' : ""} style="${style}"><div>${body}</div>${timeframe}</div>`;
}

const emitRoadmap: EmitHandler = (block, ctx) =>
  wrapBlock(
    "roadmap",
    asBlocks(block.phases)
      .map((raw) =>
        emitRoadmapPhaseCard(
          raw as {
            goals?: unknown[];
            status?: string;
            timeframe?: unknown;
            title: unknown;
          },
          ctx
        )
      )
      .join(""),
    {
      attrs: 'data-roadmap="true" data-max-columns="3"',
      className: "flex flex-wrap gap-4",
    }
  );

const emitRequirementTrace: EmitHandler = (block, ctx) => {
  const idLabel = escapeHtml(
    htmlLocaleMessage("emit.requirement-trace-id", ctx.locale)
  );
  const summaryLabel = escapeHtml(
    htmlLocaleMessage("emit.requirement-trace-summary", ctx.locale)
  );
  const statusLabel = escapeHtml(
    htmlLocaleMessage("emit.requirement-trace-status", ctx.locale)
  );
  const evidenceLabel = escapeHtml(
    htmlLocaleMessage("emit.requirement-trace-evidence", ctx.locale)
  );
  return wrapBlock(
    "requirementTrace",
    `<table class="w-full min-w-[40rem] text-left text-xs"><thead><tr class="border-b font-mono font-medium" style="border-color: var(--border-color); background-color: var(--bg-subtle); color: var(--text-secondary)"><th class="py-2.5 px-4" scope="col">${idLabel}</th><th class="py-2.5 px-4" scope="col">${summaryLabel}</th><th class="py-2.5 px-4 text-center" scope="col">${statusLabel}</th><th class="py-2.5 px-4" scope="col">${evidenceLabel}</th></tr></thead><tbody class="divide-y" style="border-color: var(--border-subtle); color: var(--text-secondary)">${asBlocks(
      block.items
    )
      .map((raw) => {
        const item = raw as {
          evidence?: unknown;
          reqId: string;
          status: string;
          summary?: unknown;
        };
        return `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40"><td class="py-2.5 px-4 font-mono font-semibold text-sky-600 dark:text-sky-400"><code>${escapeHtml(item.reqId)}</code></td><td class="py-2.5 px-4">${item.summary ? formatPlain(ctx, loc(item.summary)) : ""}</td><td class="py-2.5 px-4 text-center">${renderStatusBadge(item.status)}</td><td class="py-2.5 px-4 font-mono text-[11px]">${item.evidence ? formatRichHtml(ctx, item.evidence) : ""}</td></tr>`;
      })
      .join("")}</tbody></table>`,
    {
      className: "overflow-x-auto rounded-xl border",
      style:
        "background-color: var(--bg-surface); border-color: var(--border-color)",
    }
  );
};

const emitTestResult: EmitHandler = (block, ctx) => {
  const suites = asBlocks(block.suites) as {
    failed: number;
    name: string;
    notes?: unknown;
    passed: number;
    skipped?: number;
  }[];
  const cards = suites
    .map((suite) => {
      const failed = suite.failed;
      const skip = suite.skipped ?? 0;
      const detail = `${suite.passed} passed / ${failed} failed${skip ? ` / ${skip} skipped` : ""}`;
      let visual: "warning" | "pass" | "neutral" = "neutral";
      if (failed > 0) {
        visual = "warning";
      } else if (suite.passed > 0) {
        visual = "pass";
      }
      return `<div class="${THREE_COLUMN_ITEM_CLASS} p-3 rounded-lg border flex items-center justify-between" style="background-color: var(--bg-subtle); border-color: var(--border-subtle)"><div><div class="text-xs font-medium" style="color: var(--text-main)">${escapeHtml(suite.name)}</div><div class="text-[11px] ${failed > 0 ? "text-rose-500" : "text-emerald-600"}">${escapeHtml(detail)}</div>${suite.notes ? `<div class="text-[11px] mt-1" style="color: var(--text-muted)">${formatRichHtml(ctx, suite.notes)}</div>` : ""}</div>${renderStatusBadge(visual, { scale: "75" })}</div>`;
    })
    .join("");
  return wrapBlock(
    "testResult",
    `<div class="flex flex-wrap gap-3" data-test-results="true" data-max-columns="3">${cards}</div>`,
    {
      className: "p-5 rounded-xl border space-y-4",
      style:
        "background-color: var(--bg-surface); border-color: var(--border-color)",
    }
  );
};

const API_METHOD_CLASS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  POST: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  PUT: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  PATCH:
    "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
  DELETE: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
};

const emitApiInventory: EmitHandler = (block, ctx) => {
  const rows = asBlocks(block.endpoints)
    .map((raw) => {
      const ep = raw as {
        method: string;
        path: string;
        status?: string;
        summary?: unknown;
      };
      const method = ep.method.toUpperCase();
      const methodClass =
        API_METHOD_CLASS[method] ??
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      const summary = ep.summary
        ? `<span class="text-xs hidden sm:inline" style="color: var(--text-secondary)">${formatPlain(ctx, loc(ep.summary))}</span>`
        : "";
      const status =
        typeof ep.status === "string" && ep.status.length > 0
          ? renderStatusBadge(ep.status)
          : "";
      return `<div class="p-3.5 flex flex-col items-start sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition" data-api-endpoint="true" data-method="${attr(method)}"><div class="flex items-start sm:items-center gap-3 min-w-0 max-w-full"><span class="px-2 py-0.5 rounded font-mono text-[11px] font-bold shrink-0 ${methodClass}">${escapeHtml(method)}</span><span class="font-mono text-xs font-semibold min-w-0 [overflow-wrap:anywhere]" style="color: var(--text-main)">${escapeHtml(ep.path)}</span>${summary}</div>${status}</div>`;
    })
    .join("");
  return wrapBlock("apiInventory", rows, {
    className: "divide-y rounded-xl border",
    style:
      "background-color: var(--bg-surface); border-color: var(--border-color)",
  });
};

const emitLinkList: EmitHandler = (block, ctx) => {
  const externalIcon = renderIcon("external-link", {
    className: "w-3.5 h-3.5 opacity-70",
  });
  const inner = asBlocks(block.links)
    .map((raw) => {
      const link = raw as {
        description?: unknown;
        href: string;
        label: unknown;
      };
      const desc = link.description
        ? `<p class="text-xs" style="color: var(--text-secondary)">${formatRichHtml(ctx, link.description)}</p>`
        : "";
      return `<a class="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group" href="${attr(link.href)}" rel="noopener noreferrer" target="_blank"><div class="space-y-1"><div class="text-xs sm:text-sm font-semibold text-sky-600 dark:text-sky-400 group-hover:underline flex items-center gap-1.5"><span>${formatPlain(ctx, loc(link.label))}</span>${externalIcon}</div>${desc}</div></a>`;
    })
    .join("");
  return wrapBlock("linkList", inner, {
    className: "rounded-xl border divide-y overflow-hidden",
    style:
      "background-color: var(--bg-surface); border-color: var(--border-color); divide-color: var(--border-subtle)",
  });
};

const emitGlossary: EmitHandler = (block, ctx) =>
  wrapBlock(
    "glossary",
    asBlocks(block.terms)
      .map((raw) => {
        const term = raw as { definition: unknown; term: unknown };
        return `<div class="${THREE_COLUMN_ITEM_CLASS} p-4 rounded-xl border flex flex-col justify-between space-y-1.5" style="background-color: var(--bg-surface); border-color: var(--border-color)"><span class="font-mono font-bold text-sm text-sky-600 dark:text-sky-400">${formatPlain(ctx, loc(term.term))}</span><div class="text-xs leading-relaxed" style="color: var(--text-secondary)">${formatRichHtml(ctx, term.definition)}</div></div>`;
      })
      .join(""),
    {
      attrs: 'data-max-columns="3"',
      className: "flex flex-wrap gap-3",
    }
  );

const emitCitation: EmitHandler = (block, ctx) =>
  wrapBlock(
    "citation",
    citationItemsHtmlFor(ctx.schemaVersion)(asBlocks(block.items)),
    {
      className: "space-y-2.5",
    }
  );

const emitImage: EmitHandler = (block, ctx) => {
  const alt = formatPlain(ctx, block.alt);
  const src = attr(String(block.src));
  let inner = `<img class="w-full max-w-xl mx-auto rounded-lg border" src="${src}" alt="${alt}" loading="lazy" style="border-color: var(--border-color)" />`;
  if (block.caption) {
    inner += `<figcaption class="text-xs font-medium" style="color: var(--text-secondary)">${formatPlain(ctx, block.caption)}</figcaption>`;
  }
  return wrapBlock("image", inner, {
    className: "rounded-xl border overflow-hidden p-4 text-center space-y-3",
    style:
      "background-color: var(--bg-surface); border-color: var(--border-color)",
    tag: "figure",
  });
};

function embedMarkIcon(url: string): IconName {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host === "github.com" || host.endsWith(".github.com")) {
      return "github";
    }
  } catch {
    // Fall through to generic mark.
  }
  return "book-open";
}

const emitEmbed: EmitHandler = (block, ctx) => {
  const url = String(block.url);
  const title = block.title ? formatPlain(ctx, block.title) : escapeHtml(url);
  const mark = renderIcon(embedMarkIcon(url), { className: "w-5 h-5" });
  const external = renderIcon("external-link", {
    className:
      "w-4 h-4 text-[var(--text-muted)] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition flex-shrink-0",
  });
  const inner = `<div class="flex items-center gap-3.5 min-w-0"><div class="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center flex-shrink-0" aria-hidden="true">${mark}</div><div class="min-w-0"><div data-embed-title="true" class="text-sm font-semibold group-hover:text-sky-600 dark:group-hover:text-sky-400 transition" style="color: var(--text-main)">${title}</div><div data-embed-url="true" class="text-xs font-mono mt-0.5 truncate" style="color: var(--text-muted)">${escapeHtml(url)}</div></div></div>${external}`;
  return wrapBlock("embed", inner, {
    attrs: `href="${attr(url)}" rel="noopener noreferrer" target="_blank" data-embed-card="true"`,
    className:
      "p-4 rounded-xl border flex items-center justify-between gap-4 block group airp-interactive",
    style:
      "background-color: var(--bg-surface); border-color: var(--border-color)",
    tag: "a",
  });
};

const emitCollapsible: EmitHandler = (block, ctx, levelOffset) => {
  const chevron = renderIcon("chevron-down", {
    className:
      "size-4 shrink-0 text-[var(--text-muted)] transition-transform group-open:rotate-180",
  });
  const defaultOpen = block.defaultOpen === true;
  const storageKey = collapsibleStorageKey(
    "/",
    collapsibleInstance(ctx, block)
  );
  const attrs = [
    defaultOpen ? "open" : "",
    `data-default-open="${defaultOpen ? "true" : "false"}"`,
    `data-storage-key="${attr(storageKey)}"`,
  ]
    .filter((part) => part.length > 0)
    .join(" ");
  const inner = `<summary class="airp-interactive text-xs sm:text-sm font-medium flex items-center gap-2 select-none list-none rounded-lg -mx-1 px-1 py-0.5" data-collapsible-trigger="true" style="color: var(--text-main); border-color: transparent">${chevron}<span class="min-w-0 flex-1">${formatPlain(ctx, block.summary)}</span></summary><div class="pt-3 space-y-3">${emitChildren(asBlocks(block.children), ctx, levelOffset)}</div>`;
  return wrapBlock("collapsible", inner, {
    attrs,
    className: "group rounded-xl border p-4",
    style:
      "background-color: var(--bg-surface); border-color: var(--border-color)",
    tag: "details",
  });
};

const emitTabs: EmitHandler = (block, ctx) => {
  ctx.tabsSeq.next += 1;
  const sequence = ctx.tabsSeq.next;
  const tabsId = `airp-tabs-${sequence}`;
  const storageKey = tabsStorageKey("/", tabsInstance(ctx, block, sequence));
  const panels = asBlocks(block.panels);
  const panelKeys = panels.map((raw, index) =>
    tabsPanelKey(ctx, raw as Record<string, unknown>, index)
  );
  const defaultPanel = panelKeys[0] ?? "";
  const tabs = panels
    .map((raw, index) => {
      const panel = raw as { children?: unknown[]; label: unknown };
      const label = formatPlain(ctx, loc(panel.label));
      const tabId = `${tabsId}-tab-${index + 1}`;
      const panelId = `${tabsId}-panel-${index + 1}`;
      const selected = index === 0;
      return `<button type="button" class="shrink-0 px-4 py-2 text-xs font-medium rounded-t-lg border-b-2 border-transparent cursor-pointer text-[var(--text-secondary)] transition hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-950/40 dark:hover:text-sky-300 aria-selected:font-semibold aria-selected:border-sky-600 aria-selected:text-sky-600 dark:aria-selected:text-sky-400" id="${tabId}" role="tab" aria-controls="${panelId}" aria-selected="${selected ? "true" : "false"}" tabindex="${selected ? "0" : "-1"}" data-tabs-tab="true" data-tabs-panel-key="${attr(panelKeys[index] ?? "")}">${label}</button>`;
    })
    .join("");
  const panelHtml = panels
    .map((raw, index) => {
      const panel = raw as { children?: unknown[]; label: unknown };
      const tabId = `${tabsId}-tab-${index + 1}`;
      const panelId = `${tabsId}-panel-${index + 1}`;
      const body = emitChildren(
        asBlocks(panel.children),
        childHeadingCtx(ctx, ctx.headingLevel),
        0
      );
      return `<section class="space-y-3" id="${panelId}" role="tabpanel" aria-labelledby="${tabId}" data-tab-label="${attr(ctx.t(loc(panel.label)))}" data-tabs-panel="true"${index === 0 ? "" : " hidden"}>${body}</section>`;
    })
    .join("");
  const inner = `<div class="flex items-center border-b px-3 pt-2 gap-1 overflow-x-auto" role="tablist" aria-orientation="horizontal" data-tabs-list="true" style="border-color: var(--border-color); background-color: var(--bg-subtle)">${tabs}</div><div class="p-4" data-tabs-panels="true">${panelHtml}</div>`;
  return wrapBlock("tabs", inner, {
    attrs: `data-tabs="true" id="${tabsId}" data-default-panel="${attr(defaultPanel)}" data-storage-key="${attr(storageKey)}"`,
    className: "rounded-xl border overflow-hidden",
    style:
      "background-color: var(--bg-surface); border-color: var(--border-color)",
  });
};

const emitAppendix: EmitHandler = (block, ctx) => {
  const header = `<div class="border-b pb-2.5" data-appendix-header="true" style="border-color: var(--border-subtle)"><h4 class="text-sm font-bold tracking-tight" style="color: var(--text-main)">${escapeHtml(ctx.t(block.title as never))}</h4></div>`;
  const children = emitChildren(
    asBlocks(block.children),
    childHeadingCtx(ctx, ctx.headingLevel),
    0
  );
  return wrapBlock("appendix", `${header}${children}`, {
    className: "p-5 rounded-xl border space-y-3",
    style:
      "background-color: var(--bg-surface); border-color: var(--border-color)",
  });
};

const emitAgentNote: EmitHandler = (block, ctx) => {
  if (block.visible !== true) {
    return "";
  }
  const label = escapeHtml(
    htmlLocaleMessage("emit.agent-note-label", ctx.locale)
  );
  return wrapBlock(
    "agentNote",
    `<div class="w-5 h-5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">${renderIcon("info", { className: "size-3.5 shrink-0" })}</div><div class="min-w-0 space-y-1"><div class="text-xs font-semibold uppercase tracking-wide font-mono text-sky-700 dark:text-sky-300" data-agent-note-chrome="true">${label}</div><p class="text-xs leading-relaxed [overflow-wrap:anywhere]" style="color: var(--text-secondary)">${formatRichHtml(ctx, block.text)}</p></div>`,
    {
      attrs: 'data-agent-note="true"',
      className:
        "p-4 rounded-xl border border-sky-200 bg-sky-50/40 dark:border-sky-800 dark:bg-sky-950/20 flex items-start gap-3",
      tag: "aside",
    }
  );
};

export const BLOCK_HANDLERS: Readonly<Record<string, EmitHandler>> = {
  agentNote: emitAgentNote,
  apiInventory: emitApiInventory,
  appendix: emitAppendix,
  architectureOverview: emitArchitectureOverview,
  assumption: emitAssumption,
  blockquote: emitBlockquote,
  bulletList: emitBulletList,
  callout: emitCallout,
  checklist: emitChecklist,
  citation: emitCitation,
  code: emitCode,
  codeDiff: emitCodeDiff,
  collapsible: emitCollapsible,
  collection: emitCollection,
  comparison: emitComparison,
  constraint: emitConstraint,
  decision: emitDecision,
  definitionList: emitDefinitionList,
  divider: emitDivider,
  embed: emitEmbed,
  fileChangeList: emitFileChangeList,
  fileTree: emitFileTree,
  flowSteps: emitFlowSteps,
  glossary: emitGlossary,
  group: emitGroup,
  heading: emitHeading,
  hero: emitHero,
  image: emitImage,
  keyValueList: emitKeyValueList,
  lead: emitLead,
  linkList: emitLinkList,
  mermaid: emitMermaid,
  numberedList: emitNumberedList,
  openQuestion: emitOpenQuestion,
  paragraph: emitParagraph,
  pullQuote: emitPullQuote,
  requirementTrace: emitRequirementTrace,
  risk: emitRisk,
  roadmap: emitRoadmap,
  section: emitSection,
  spacer: emitSpacer,
  statusBoard: emitStatusBoard,
  table: emitTable,
  tabs: emitTabs,
  testResult: emitTestResult,
  timeline: emitTimeline,
};
