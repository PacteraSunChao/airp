import { AirpDiagnosticError, diagnostic } from "@airp/diagnostics";
import { assertSchemaVersion } from "@airp/protocol";
import type { AirpDocumentModel } from "@airp/renderer-shared";
import { createLocaleFormatContext, isBlockBase } from "@airp/renderer-shared";
import { RENDERER_TARGETS_HTML_UNKNOWN_BLOCK_TYPE } from "./diagnostic-codes.js";
import { BLOCK_HANDLERS, setEmitBlockRef } from "./emit-handlers.js";
import type { EmitContext } from "./emit-helpers.js";
import {
  injectMachineHandle,
  readBlockHandle,
} from "./shared/inject-machine-handle.js";

export type { EmitContext } from "./emit-helpers.js";

export function emitBlock(
  block: unknown,
  ctx: EmitContext,
  levelOffset = 0
): string {
  if (!isBlockBase(block)) {
    throw new AirpDiagnosticError([
      diagnostic(
        RENDERER_TARGETS_HTML_UNKNOWN_BLOCK_TYPE,
        "Block is missing a string type",
        { details: { block } }
      ),
    ]);
  }

  const handler = BLOCK_HANDLERS[block.type];
  if (!handler) {
    throw new AirpDiagnosticError([
      diagnostic(
        RENDERER_TARGETS_HTML_UNKNOWN_BLOCK_TYPE,
        `Unknown block type "${block.type}"`,
        { details: { type: block.type } }
      ),
    ]);
  }
  const html = handler(block, ctx, levelOffset);
  if (ctx.machineHandles !== true) {
    return html;
  }
  const handle = readBlockHandle(block);
  return handle === undefined ? html : injectMachineHandle(html, handle);
}

setEmitBlockRef(emitBlock);

export interface EmitBlocksOptions {
  /**
   * Emit each block's Machine Handle (`@id`) as `data-airp-id`, so a host can
   * map rendered DOM back to document nodes. Off unless asked for.
   */
  machineHandles?: boolean;
  takeHighlightedCode?: () => string | undefined;
  takeMermaidSvg?: () => string;
}

export interface EmitBlocksResult {
  html: string;
  tocEntries: EmitContext["tocEntries"];
}

export function emitBlocks(
  blocks: readonly unknown[],
  doc: AirpDocumentModel,
  locale: string,
  options: EmitBlocksOptions = {}
): EmitBlocksResult {
  assertSchemaVersion(doc.schemaVersion);
  const tocEntries: EmitContext["tocEntries"] = [];
  const ctx: EmitContext = {
    ...createLocaleFormatContext(doc, locale),
    schemaVersion: doc.schemaVersion,
    headingLevel: 2,
    mermaidViewerSeq: { next: 0 },
    collapsibleSeq: { next: 0 },
    sectionIds: new Set(),
    tocEntries,
    tabsSeq: { next: 0 },
    topSectionCount: 0,
    machineHandles: options.machineHandles,
    takeMermaidSvg: options.takeMermaidSvg,
    takeHighlightedCode: options.takeHighlightedCode,
  };
  return {
    html: blocks.map((b) => emitBlock(b, ctx)).join(""),
    tocEntries,
  };
}
