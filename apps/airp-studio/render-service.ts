/**
 * The local render service behind the Studio canvas.
 *
 * The Studio does **not** render the document itself. It asks this service, and
 * this service calls the very implementation the AIRP Renderer uses —
 * `@airp/renderer/node/render`, the same function behind `airp-render` and the
 * VS Code worker. That is the only way the canvas and the export can be the same
 * bytes rather than merely similar: Mermaid is laid out in jsdom with stubbed
 * text measurement, so a browser rendering the same source would produce a
 * different diagram.
 *
 * This file is Node-side and lives outside `src/`, which is the browser surface:
 * `check-runtime-entries` keeps the browser surface free of Node builtins and of
 * the packages' Node entries, and the platform table classifies a host by its
 * exports surface rather than by a local harness like this one.
 */

/** What the canvas asks for. */
export type RenderServiceTarget = "html" | "markdown";

export interface RenderServiceRequest {
  document: unknown;
  /**
   * Emit `data-airp-id` on every block and structured object.
   *
   * The canvas asks for these because a click has to resolve to a document node.
   * An **export** does not: it must be the exact file the Renderer produces, and
   * the Renderer never asks for handles.
   */
  machineHandles?: boolean;
  /** Defaults to `html`. */
  target?: RenderServiceTarget;
}

export interface RenderServiceSuccess {
  body: string;
  diagnostics: { code: string; severity: string }[];
  ok: true;
}

export interface RenderServiceFailure {
  message: string;
  ok: false;
}

export type RenderServiceResult = RenderServiceFailure | RenderServiceSuccess;

/** Renderer knobs for one request. Handles are opt-in on the HTML target only. */
function targetOptionsFor(
  target: RenderServiceTarget,
  machineHandles: boolean
): Record<string, unknown> {
  return target === "html" && machineHandles ? { machineHandles: true } : {};
}

/** The Renderer function this service calls; resolved by the host's loader. */
export type RenderDocumentFn =
  typeof import("@airp/renderer/node/render").renderDocument;

/** Resolve the Renderer's Node entry. See the note on that entry below. */
export type RenderDocumentLoader = () => Promise<RenderDocumentFn>;

/**
 * Render one document with the Renderer's own Node pipeline.
 *
 * The entry is *source*, not a build: `@airp/renderer/node/render` points at
 * `src/node/render-document.ts` and the hosts that use it (the CLI, the VS Code
 * worker) bundle it. Plain Node cannot import it, so the caller supplies a
 * loader — Vite's SSR module runner, which transpiles workspace TypeScript.
 *
 * The load is lazy and the module is cached by that runner, so a dev server does
 * not pay for Mermaid, jsdom and Shiki until a document needs rendering, and
 * only pays once.
 */
export async function renderForStudio(
  request: RenderServiceRequest,
  load: RenderDocumentLoader
): Promise<RenderServiceResult> {
  const target: RenderServiceTarget = request.target ?? "html";
  let renderDocument: RenderDocumentFn;
  try {
    renderDocument = await load();
  } catch (error) {
    return {
      // The first run on a clean checkout is the common way to get here: the
      // HTML target's Node entry is a build artifact, so say what to build.
      message: `本地渲染服务无法加载 Renderer：${
        error instanceof Error ? error.message : String(error)
      }（若刚克隆仓库，先执行 pnpm --filter @airp/renderer-target-html build）`,
      ok: false,
    };
  }

  try {
    const rendered = await renderDocument(request.document as never, target, {
      targetOptions: targetOptionsFor(target, request.machineHandles === true),
    });
    if (!rendered.ok) {
      return {
        message: `渲染失败：${rendered.diagnostics
          .map((diagnostic) => diagnostic.code)
          .join("、")}`,
        ok: false,
      };
    }
    return {
      body: String(rendered.value.files[0]?.body ?? ""),
      diagnostics: (rendered.diagnostics ?? []).map((diagnostic) => ({
        code: diagnostic.code,
        severity: String(diagnostic.severity),
      })),
      ok: true,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : String(error),
      ok: false,
    };
  }
}

/** Where the browser reaches the service. */
export const RENDER_SERVICE_PATH = "/__airp/render";

/** Read a request body, capped so a runaway client cannot exhaust memory. */
export async function readJsonBody(
  stream: AsyncIterable<Uint8Array>
): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.byteLength;
    if (size > MAX_BODY_BYTES) {
      throw new Error("请求体过大");
    }
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text.length === 0 ? {} : JSON.parse(text);
}

const MAX_BODY_BYTES = 32 * 1024 * 1024;
