// biome-ignore lint/performance/noBarrelFile: package public API entry point
export {
  RENDERER_TARGET_MARKDOWN_DIAGNOSTIC_CODES,
  RENDERER_TARGET_MARKDOWN_DIAGNOSTIC_ENTRIES,
  RENDERER_TARGETS_MARKDOWN_UNKNOWN_BLOCK_TYPE,
  type RendererTargetMarkdownDiagnosticCode,
  UNIT_COVERED_RENDERER_TARGET_MARKDOWN_DIAGNOSTIC_CODES,
} from "./diagnostic-codes.js";
export { type EmitContext, emitBlock, emitBlocks } from "./emit-block.js";
export { emitDocument } from "./emit-document.js";
export { markdownTarget } from "./module.js";
export { renderMarkdown } from "./render.js";
