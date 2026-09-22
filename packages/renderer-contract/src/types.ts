import type { AirpDiagnostic } from "@airp/diagnostics";
import type { SchemaVersion } from "@airp/protocol";

export type RenderTarget = "html" | "markdown";

/** Caller input: optional host knobs (locale comes from the document). */
export interface RenderContext {
  renderRoot?: string;
  showDiagnostics?: boolean;
  /**
   * Opaque per-target knobs. Pipeline forwards as-is; each target documents
   * which keys it reads. Unknown keys / wrong types are skipped.
   */
  targetOptions?: Readonly<Record<string, unknown>>;
}

/** Context targets render with — document + locale derived from `document.i18n`. */
export interface ResolvedRenderContext {
  document: AirpDocumentSnapshot;
  /**
   * Document content locale:
   * - schema 1.1.0: `i18n.locale`
   * - schema 1.0.0: `i18n.defaultLocale`
   */
  locale: string;
  renderRoot?: string;
  showDiagnostics?: boolean;
  /** Forwarded from `RenderContext.targetOptions` unchanged. */
  targetOptions?: Readonly<Record<string, unknown>>;
}

/**
 * Minimal document snapshot shared by all targets.
 * Structural; validated upstream before render.
 */
export interface AirpDocumentSnapshot {
  blocks: readonly unknown[];
  i18n: {
    /** schema 1.0.0 */
    defaultLocale?: string;
    /** schema 1.1.0 */
    locale?: string;
    /** schema 1.0.0 */
    locales?: readonly string[];
    /** schema 1.0.0 only — chrome strings per locale; 1.1.0 forbids `ui` */
    ui?: Readonly<Record<string, Readonly<Record<string, string>>>>;
  };
  meta: {
    /** schema 1.0.0 */
    authors?: readonly string[];
    createdAt?: string;
    /** schema 1.1.0 */
    createdBy?: string;
    kind?: string;
    subtitle?: unknown;
    tags?: readonly string[];
    title: unknown;
    updatedAt?: string;
    /** schema 1.1.0 */
    updatedBy?: string;
  };
  schemaVersion: string;
}

/** Primary render output (target-internal, wrapped into `RenderOutput.files`). */
export interface RenderPrimary {
  body: string | Uint8Array;
  mimeType: string;
  relPath: string;
}

/** Target-local output before pipeline wraps files and merges diagnostics. */
export interface TargetRenderOutput {
  diagnostics?: AirpDiagnostic[];
  format: RenderTarget;
  primary: RenderPrimary;
}

/** One file the host must write, at `path` relative to the output root. */
export interface RenderFile {
  body: string | Uint8Array;
  path: string;
}

/** Full render result: files the host writes to the output root. */
export interface RenderOutput {
  files: RenderFile[];
  format: RenderTarget;
}

export interface RenderTargetModule {
  /** Hard-fail when this target has no presentation for `version`. */
  assertComplete(version: SchemaVersion): void;
  render(
    ctx: ResolvedRenderContext
  ): Promise<TargetRenderOutput> | TargetRenderOutput;
  readonly target: RenderTarget;
}
