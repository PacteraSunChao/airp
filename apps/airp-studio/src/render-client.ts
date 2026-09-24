/**
 * The browser's only way to render: ask the local render service.
 *
 * Nothing in the browser surface renders a document. The service runs the AIRP
 * Renderer's own Node pipeline, so the canvas shows the bytes the Renderer would
 * export — which a browser-side render cannot promise, because Mermaid is laid
 * out there with stubbed text measurement.
 */

export type RenderTarget = "html" | "markdown";

export interface RenderSuccess {
  body: string;
  diagnostics: { code: string; severity: string }[];
  ok: true;
}

export interface RenderFailure {
  message: string;
  ok: false;
}

export type RenderResult = RenderFailure | RenderSuccess;

const ENDPOINT = "/__airp/render";

/** A message that says what to do, not just that something went wrong. */
const UNREACHABLE =
  "本地渲染服务不可用。Studio 的画布由 AIRP Renderer 自己的实现渲染，所以需要它的本地服务：用 pnpm --filter airp-studio dev 或 pnpm --filter airp-studio preview 启动，直接打开 dist 里的静态文件不行。";

/**
 * Render one document through the service.
 *
 * `machineHandles` is on for the canvas (a click has to resolve to a node) and
 * off for an export, which must be the file the Renderer itself would write.
 */
export async function renderViaService(
  snapshot: unknown,
  target: RenderTarget,
  machineHandles = false
): Promise<RenderResult> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      body: JSON.stringify({ document: snapshot, machineHandles, target }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
  } catch {
    return { message: UNREACHABLE, ok: false };
  }
  if (!response.ok) {
    return {
      message: `本地渲染服务返回 ${String(response.status)}`,
      ok: false,
    };
  }
  try {
    return (await response.json()) as RenderResult;
  } catch {
    return { message: "本地渲染服务返回了无法解析的内容", ok: false };
  }
}
