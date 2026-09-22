import { citationItemsMdFor } from "./citation-items/registry.js";
import type { EmitContext, EmitHandler } from "./emit-helpers.js";
import {
  asBlocks,
  cellText,
  childHeadingCtx,
  extractBulletListRows,
  fence,
  gfmTable,
  loc,
  mdHeading,
  stripLeadingOrdinal,
} from "./emit-helpers.js";

// Forward declaration filled after handlers; emitChildren needs emitBlock.
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

const emitHero: EmitHandler = (block, ctx) => {
  const { t, tr } = ctx;
  let out = "";
  for (const m of asBlocks(block.metrics)) {
    if (!m || typeof m !== "object") {
      continue;
    }
    const metric = m as Record<string, unknown>;
    const title = metric.title ? t(metric.title as never) : "";
    const val = metric.value == null ? "" : String(metric.value);
    const unit = metric.unit ? t(metric.unit as never) : "";
    const desc = metric.description ? tr(metric.description as never) : "";
    out += `- **${title}**: ${val}${unit ? ` ${unit}` : ""}${desc ? ` — ${desc}` : ""}\n`;
  }
  const badges = asBlocks(block.badges);
  if (badges.length) {
    out += badges
      .map((b) => {
        const badge = b as { label: unknown };
        return `- _${t(loc(badge.label))}_\n`;
      })
      .join("");
  }
  return `${out}\n`;
};

const emitSection: EmitHandler = (block, ctx, levelOffset) => {
  const { t, tr } = ctx;
  const level =
    (typeof block.level === "number" ? block.level : 2) + levelOffset;
  let out = mdHeading(level, t(block.title as never));
  if (block.lead) {
    out += `> ${tr(block.lead as never).replace(/\n/g, "\n> ")}\n\n`;
  }
  out += emitChildren(asBlocks(block.children), childHeadingCtx(ctx, level), 0);
  return out;
};

const emitGroup: EmitHandler = (block, ctx, levelOffset) => {
  const { t } = ctx;
  const hasTitle = Boolean(block.title);
  let out = hasTitle
    ? mdHeading(ctx.headingLevel, t(block.title as never))
    : "";
  const childCtx = hasTitle ? childHeadingCtx(ctx, ctx.headingLevel) : ctx;
  out += emitChildren(asBlocks(block.children), childCtx, levelOffset);
  return out;
};

const emitDivider: EmitHandler = (block, ctx) =>
  block.label ? `---\n\n_${ctx.t(block.label as never)}_\n\n` : "---\n\n";

const emitSpacer: EmitHandler = () => "\n";

const emitHeading: EmitHandler = (block, ctx, levelOffset) =>
  mdHeading(
    (typeof block.level === "number" ? block.level : 2) + levelOffset,
    ctx.t(block.text as never)
  );

const emitParagraph: EmitHandler = (block, ctx) =>
  `${ctx.tr(block.text as never)}\n\n`;

const emitLead: EmitHandler = (block, ctx) =>
  `> ${ctx.tr(block.text as never).replace(/\n/g, "\n> ")}\n\n`;

const emitPullQuote: EmitHandler = (block, ctx) => {
  const { t } = ctx;
  let out = `> ${t(block.text as never)}\n`;
  if (block.attribution) {
    out += `>\n> — ${t(block.attribution as never)}\n`;
  }
  return `${out}\n`;
};

const emitBlockquote: EmitHandler = (block, ctx) =>
  `> ${ctx.tr(block.text as never).replace(/\n/g, "\n> ")}\n\n`;

const emitCallout: EmitHandler = (block, ctx) => {
  const { t, tr } = ctx;
  const title = block.title ? `**${t(block.title as never)}**\n\n` : "";
  return `> ${title}${tr(block.body as never).replace(/\n/g, "\n> ")}\n\n`;
};

const emitBulletList: EmitHandler = (block, ctx) =>
  `${asBlocks(block.items)
    .map((item) => `- ${ctx.tr(item as never)}\n`)
    .join("")}\n`;

const emitNumberedList: EmitHandler = (block, ctx) =>
  `${asBlocks(block.items)
    .map((item, i) => `${i + 1}. ${ctx.tr(item as never)}\n`)
    .join("")}\n`;

const emitChecklist: EmitHandler = (block, ctx) =>
  `${asBlocks(block.items)
    .map((raw) => {
      const item = raw as {
        checked?: boolean;
        label: unknown;
        note?: unknown;
      };
      const box = item.checked ? "x" : " ";
      const note = item.note ? ` — ${ctx.tr(item.note as never)}` : "";
      return `- [${box}] ${ctx.tr(item.label as never)}${note}\n`;
    })
    .join("")}\n`;

const emitDefinitionList: EmitHandler = (block, ctx) =>
  `${asBlocks(block.items)
    .map((raw) => {
      const item = raw as { definition: unknown; term: unknown };
      return `**${ctx.t(loc(item.term))}**:\n${ctx.tr(item.definition as never)}\n\n`;
    })
    .join("")}\n`;

const emitTable: EmitHandler = (block, ctx) => {
  const { t } = ctx;
  const cols = asBlocks(block.columns) as { key: string; label: unknown }[];
  const headers = cols.map((c) => t(loc(c.label)));
  const rows = asBlocks(block.rows).map((row) => {
    const record = row as Record<string, unknown>;
    return cols.map((c) => cellText(record[c.key], ctx));
  });
  let out = block.caption ? `_${t(block.caption as never)}_\n\n` : "";
  out += gfmTable(headers, rows);
  if (block.footerRow && typeof block.footerRow === "object") {
    const footerRow = block.footerRow as Record<string, unknown>;
    const footer = cols.map((c) => cellText(footerRow[c.key], ctx));
    out += gfmTable(headers, [footer]);
  }
  return out;
};

const emitComparison: EmitHandler = (block, ctx, levelOffset) => {
  const { t } = ctx;
  const beforeLabel = block.labelBefore
    ? t(block.labelBefore as never)
    : "Before";
  const afterLabel = block.labelAfter ? t(block.labelAfter as never) : "After";
  const beforeRows = extractBulletListRows(asBlocks(block.before), ctx);
  const afterRows = extractBulletListRows(asBlocks(block.after), ctx);

  if (beforeRows && afterRows) {
    const rowCount = Math.max(beforeRows.length, afterRows.length);
    const rows: string[][] = [];
    for (let i = 0; i < rowCount; i++) {
      rows.push([beforeRows[i] ?? "", afterRows[i] ?? ""]);
    }
    return gfmTable([beforeLabel, afterLabel], rows);
  }

  let out = mdHeading(ctx.headingLevel, beforeLabel);
  out += emitChildren(asBlocks(block.before), ctx, levelOffset);
  out += mdHeading(ctx.headingLevel, afterLabel);
  out += emitChildren(asBlocks(block.after), ctx, levelOffset);
  return out;
};

const emitCollection: EmitHandler = (block, ctx) => {
  const { t, tr } = ctx;
  let out = block.title
    ? mdHeading(ctx.headingLevel, t(block.title as never))
    : "";
  for (const raw of asBlocks(block.items)) {
    const item = raw as Record<string, unknown>;
    const title = item.title ? t(item.title as never) : "";
    const val =
      item.value == null
        ? ""
        : `${item.value}${item.unit ? ` ${t(item.unit as never)}` : ""}`;
    const desc = item.description ? tr(item.description as never) : "";
    out += `- **${title}**${val ? `: ${val}` : ""}${desc ? ` — ${desc}` : ""}\n`;
  }
  return `${out}\n`;
};

const emitKeyValueList: EmitHandler = (block, ctx) =>
  gfmTable(
    ["Key", "Value"],
    asBlocks(block.items).map((raw) => {
      const item = raw as { key: unknown; value: unknown };
      return [ctx.t(loc(item.key)), ctx.tr(item.value as never)];
    })
  );

const emitStatusBoard: EmitHandler = (block, ctx) =>
  gfmTable(
    ["Item", "Status", "Detail"],
    asBlocks(block.items).map((raw) => {
      const item = raw as {
        detail?: unknown;
        label: unknown;
        status: string;
      };
      return [
        ctx.t(loc(item.label)),
        item.status,
        item.detail ? ctx.tr(item.detail as never) : "",
      ];
    })
  );

const emitCode: EmitHandler = (block) => {
  const filename =
    typeof block.filename === "string" ? `\`${block.filename}\`\n\n` : "";
  return (
    filename +
    fence(
      String(block.code ?? ""),
      typeof block.language === "string" ? block.language : undefined
    )
  );
};

const emitCodeDiff: EmitHandler = (block) => {
  const filename =
    typeof block.filename === "string" ? `\`${block.filename}\`\n\n` : "";
  const lang = typeof block.language === "string" ? block.language : "diff";
  if (typeof block.unified === "string") {
    return filename + fence(block.unified, lang);
  }
  const fileName = typeof block.filename === "string" ? block.filename : "file";
  const before =
    typeof block.before === "string"
      ? `-${block.before.split("\n").join("\n-")}`
      : "";
  const after =
    typeof block.after === "string"
      ? `+${block.after.split("\n").join("\n+")}`
      : "";
  const diff = [`--- a/${fileName}`, `+++ b/${fileName}`, before, after]
    .filter(Boolean)
    .join("\n");
  return filename + fence(diff, lang);
};

const emitFileTree: EmitHandler = (block, ctx) => {
  const { t } = ctx;
  const lines: string[] = [];
  function walk(
    node: {
      annotation?: unknown;
      children?: unknown[];
      name: string;
    },
    prefix: string
  ) {
    const note = node.annotation ? ` (${t(node.annotation as never)})` : "";
    lines.push(`${prefix}${node.name}${note}`);
    for (const child of node.children ?? []) {
      walk(child as typeof node, `${prefix}  `);
    }
  }
  const root = block.root as {
    annotation?: unknown;
    children?: unknown[];
    name: string;
  };
  walk(root, "");
  let out = mdHeading(
    ctx.headingLevel,
    ctx.ui("fileTreeToolbarTitle", "File tree")
  );
  if (block.caption) {
    out += `_${t(block.caption as never)}_\n\n`;
  }
  return out + fence(lines.join("\n"), "text");
};

const emitFileChangeList: EmitHandler = (block, ctx) =>
  gfmTable(
    ["Path", "Change", "Note"],
    asBlocks(block.items).map((raw) => {
      const item = raw as { change: string; note?: unknown; path: string };
      return [
        item.path,
        item.change,
        item.note ? ctx.tr(item.note as never) : "",
      ];
    })
  );

const emitMermaid: EmitHandler = (block, ctx) => {
  let out = block.title ? `${ctx.t(block.title as never)}\n\n` : "";
  out += fence(String(block.source ?? ""), "mermaid");
  return out;
};

const emitArchitectureOverview: EmitHandler = (block, ctx, levelOffset) => {
  let out = "";
  const overview = block.overview as { source?: string } | undefined;
  if (overview?.source) {
    out += fence(overview.source, "mermaid");
  }
  const modules = asBlocks(block.modules);
  if (modules.length) {
    out += emitBlockRef(
      { items: modules, type: "collection", variant: "panel" },
      ctx,
      levelOffset
    );
  }
  return out;
};

const emitFlowSteps: EmitHandler = (block, ctx) =>
  asBlocks(block.steps)
    .map((raw, i) => {
      const step = raw as {
        description?: unknown;
        status?: string;
        title: unknown;
      };
      const title = stripLeadingOrdinal(ctx.t(loc(step.title)));
      const status = step.status ? ` (${step.status})` : "";
      const desc = step.description
        ? `\n  ${ctx.tr(step.description as never)}`
        : "";
      return `${i + 1}. **${title}**${status}${desc}\n`;
    })
    .join("")
    .concat("\n");

const emitDecision: EmitHandler = (block, ctx) => {
  const { t, tr } = ctx;
  let out = mdHeading(ctx.headingLevel, t(block.title as never));
  out += `_Status: ${String(block.status)}_\n\n`;
  if (block.context) {
    out += `${tr(block.context as never)}\n\n`;
  }
  if (block.chosen) {
    out += `**Chosen:** ${t(block.chosen as never)}\n\n`;
  }
  if (block.rationale) {
    out += `${tr(block.rationale as never)}\n\n`;
  }
  for (const raw of asBlocks(block.options)) {
    const opt = raw as { cons?: unknown; label: unknown; pros?: unknown };
    out += `- **${t(opt.label as never)}**`;
    if (opt.pros) {
      out += `\n  - Pros: ${tr(opt.pros as never)}`;
    }
    if (opt.cons) {
      out += `\n  - Cons: ${tr(opt.cons as never)}`;
    }
    out += "\n";
  }
  if (asBlocks(block.options).length) {
    out += "\n";
  }
  return out;
};

const emitRisk: EmitHandler = (block, ctx) => {
  const { t, tr } = ctx;
  let out = mdHeading(ctx.headingLevel, t(block.title as never));
  out += `_Severity: ${String(block.severity)}_`;
  if (block.status) {
    out += ` · _Status: ${String(block.status)}_`;
  }
  out += "\n\n";
  if (block.description) {
    out += `${tr(block.description as never)}\n\n`;
  }
  if (block.mitigation) {
    out += `**Mitigation:** ${tr(block.mitigation as never)}\n\n`;
  }
  return out;
};

const emitAssumption: EmitHandler = (block, ctx) =>
  `- ${block.validated ? "[x]" : "[ ]"} ${ctx.tr(block.statement as never)}\n\n`;

const emitConstraint: EmitHandler = (block, ctx) => {
  const tag = block.nonNegotiable ? " _(non-negotiable)_" : "";
  return `- ${ctx.tr(block.rule as never)}${tag}\n\n`;
};

const emitOpenQuestion: EmitHandler = (block, ctx) => {
  const tag = block.blocking ? " _(blocking)_" : "";
  return `- ${ctx.tr(block.question as never)}${tag}\n\n`;
};

const emitTimeline: EmitHandler = (block, ctx) =>
  asBlocks(block.events)
    .map((raw) => {
      const ev = raw as {
        date?: string;
        description?: unknown;
        status?: string;
        title: unknown;
      };
      const date = ev.date ? `${ev.date}: ` : "";
      const status = ev.status ? ` (${ev.status})` : "";
      const desc = ev.description
        ? `\n  ${ctx.tr(ev.description as never)}`
        : "";
      return `- ${date}**${ctx.t(loc(ev.title))}**${status}${desc}\n`;
    })
    .join("")
    .concat("\n");

const emitRoadmap: EmitHandler = (block, ctx) =>
  asBlocks(block.phases)
    .map((raw) => {
      const phase = raw as {
        goals?: unknown[];
        status?: string;
        timeframe?: unknown;
        title: unknown;
      };
      let out = mdHeading(
        ctx.headingLevel + 1,
        `${ctx.t(loc(phase.title))}${phase.timeframe ? ` (${ctx.t(loc(phase.timeframe))})` : ""}`
      );
      if (phase.status) {
        out += `_Status: ${phase.status}_\n\n`;
      }
      if (phase.goals?.length) {
        out += phase.goals.map((g) => `- ${ctx.tr(g as never)}\n`).join("");
        out += "\n";
      }
      return out;
    })
    .join("");

const emitRequirementTrace: EmitHandler = (block, ctx) =>
  gfmTable(
    ["ID", "Summary", "Status", "Evidence"],
    asBlocks(block.items).map((raw) => {
      const item = raw as {
        evidence?: unknown;
        reqId: string;
        status: string;
        summary?: unknown;
      };
      return [
        item.reqId,
        item.summary ? ctx.t(loc(item.summary)) : "",
        item.status,
        item.evidence ? ctx.tr(item.evidence as never) : "",
      ];
    })
  );

const emitTestResult: EmitHandler = (block, ctx) =>
  asBlocks(block.suites)
    .map((raw) => {
      const suite = raw as {
        failed: number;
        name: string;
        notes?: unknown;
        passed: number;
        skipped?: number;
      };
      const skip = suite.skipped == null ? "" : `, skipped ${suite.skipped}`;
      let out = `- **${suite.name}**: ${suite.passed} passed, ${suite.failed} failed${skip}\n`;
      if (suite.notes) {
        out += `  ${ctx.tr(suite.notes as never)}\n`;
      }
      return out;
    })
    .join("")
    .concat("\n");

const emitApiInventory: EmitHandler = (block, ctx) =>
  gfmTable(
    ["Method", "Path", "Summary", "Status"],
    asBlocks(block.endpoints).map((raw) => {
      const ep = raw as {
        method: string;
        path: string;
        status?: string;
        summary?: unknown;
      };
      return [
        ep.method,
        ep.path,
        ep.summary ? ctx.t(loc(ep.summary)) : "",
        ep.status ?? "",
      ];
    })
  );

const emitLinkList: EmitHandler = (block, ctx) => {
  const { t, tr } = ctx;
  let out = block.title
    ? mdHeading(ctx.headingLevel, t(block.title as never))
    : "";
  out += asBlocks(block.links)
    .map((raw) => {
      const link = raw as {
        description?: unknown;
        href: string;
        label: unknown;
      };
      const desc = link.description
        ? ` — ${tr(link.description as never)}`
        : "";
      return `- [${t(loc(link.label))}](${link.href})${desc}\n`;
    })
    .join("");
  return `${out}\n`;
};

const emitGlossary: EmitHandler = (block, ctx) =>
  asBlocks(block.terms)
    .map((raw) => {
      const term = raw as { definition: unknown; term: unknown };
      return `- **${ctx.t(loc(term.term))}**: ${ctx.tr(term.definition as never)}\n`;
    })
    .join("")
    .concat("\n");

const emitCitation: EmitHandler = (block, ctx) =>
  citationItemsMdFor(ctx.schemaVersion)(asBlocks(block.items));

const emitImage: EmitHandler = (block, ctx) => {
  const cap = block.caption ? `\n\n_${ctx.t(block.caption as never)}_` : "";
  return `![${ctx.t(block.alt as never)}](${String(block.src)})${cap}\n\n`;
};

const emitEmbed: EmitHandler = (block, ctx) =>
  `[${block.title ? ctx.t(block.title as never) : String(block.url)}](${String(block.url)})\n\n`;

const emitCollapsible: EmitHandler = (block, ctx, levelOffset) => {
  let out = `<details${block.defaultOpen ? " open" : ""}>\n<summary>${ctx.t(block.summary as never)}</summary>\n\n`;
  out += emitChildren(asBlocks(block.children), ctx, levelOffset);
  out += "</details>\n\n";
  return out;
};

const emitTabs: EmitHandler = (block, ctx) =>
  asBlocks(block.panels)
    .map((raw) => {
      const panel = raw as { children?: unknown[]; label: unknown };
      let out = mdHeading(ctx.headingLevel, ctx.t(loc(panel.label)));
      out += emitChildren(
        asBlocks(panel.children),
        childHeadingCtx(ctx, ctx.headingLevel),
        0
      );
      return out;
    })
    .join("");

const emitAppendix: EmitHandler = (block, ctx) => {
  let out = mdHeading(ctx.headingLevel, ctx.t(block.title as never));
  out += emitChildren(
    asBlocks(block.children),
    childHeadingCtx(ctx, ctx.headingLevel),
    0
  );
  return out;
};

const emitAgentNote: EmitHandler = (block, ctx) => {
  // Only visible === true enters human-facing Markdown (init.md).
  if (block.visible !== true) {
    return "";
  }
  return `> _Agent note:_ ${ctx.tr(block.text as never)}\n\n`;
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
