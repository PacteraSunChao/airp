// biome-ignore lint/performance/noBarrelFile: package public API entry point
export {
  RENDERER_SHARED_DIAGNOSTIC_CODES,
  RENDERER_SHARED_DIAGNOSTIC_ENTRIES,
  RENDERER_SHARED_LOCALE_LOCALIZED_STRING_MISSING,
  type RendererSharedDiagnosticCode,
  UNIT_COVERED_RENDERER_SHARED_DIAGNOSTIC_CODES,
} from "./diagnostic-codes.js";
export type {
  AirpDocumentModel,
  BlockBase,
  InlineNode,
  LocalizedString,
  LocalizedStringMap,
  RichText,
} from "./document-model.js";
export { asDocumentModel, isBlockBase } from "./guards.js";
export { documentRenderLocale } from "./locale/document-render-locale.js";
export {
  createLocaleFormatContext,
  type LocaleFormatContext,
} from "./locale/format-context.js";
export { resolveLocalized } from "./locale/resolve-localized/registry.js";
export { resolveRichText } from "./locale/resolve-rich-text.js";
