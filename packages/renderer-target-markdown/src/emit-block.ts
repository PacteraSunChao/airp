import { AirpDiagnosticError, diagnostic } from "@airp/diagnostics";
import { assertSchemaVersion } from "@airp/protocol";
import type { AirpDocumentModel } from "@airp/renderer-shared";
import { createLocaleFormatContext, isBlockBase } from "@airp/renderer-shared";
import { RENDERER_TARGETS_MARKDOWN_UNKNOWN_BLOCK_TYPE } from "./diagnostic-codes.js";
import { BLOCK_HANDLERS, setEmitBlockRef } from "./emit-handlers.js";
import type { EmitContext } from "./emit-helpers.js";

export type { EmitContext } from "./emit-helpers.js";

export function emitBlock(
  block: unknown,
  ctx: EmitContext,
  levelOffset = 0
): string {
  if (!isBlockBase(block)) {
    throw new AirpDiagnosticError([
      diagnostic(
        RENDERER_TARGETS_MARKDOWN_UNKNOWN_BLOCK_TYPE,
        "Block is missing a string type",
        { details: { block } }
      ),
    ]);
  }

  const handler = BLOCK_HANDLERS[block.type];
  if (!handler) {
    throw new AirpDiagnosticError([
      diagnostic(
        RENDERER_TARGETS_MARKDOWN_UNKNOWN_BLOCK_TYPE,
        `Unknown block type "${block.type}"`,
        { details: { type: block.type } }
      ),
    ]);
  }
  return handler(block, ctx, levelOffset);
}

setEmitBlockRef(emitBlock);

export function emitBlocks(
  blocks: readonly unknown[],
  doc: AirpDocumentModel,
  locale: string
): string {
  assertSchemaVersion(doc.schemaVersion);
  const ctx: EmitContext = {
    ...createLocaleFormatContext(doc, locale),
    schemaVersion: doc.schemaVersion,
    headingLevel: 2,
  };
  return blocks.map((b) => emitBlock(b, ctx)).join("");
}
