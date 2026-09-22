import { readFile } from "node:fs/promises";
import { Uri, type Webview } from "vscode";
import { customFindMarkerHtml } from "./custom-find-marker";
import type { DiagnosticLine } from "./diagnostic-lines";
import { escapeHtml } from "./escape-html";
import {
  WEBVIEW_HOST_CSS,
  WEBVIEW_REMOVE_DEFAULT_STYLES_JS,
} from "./webview-code-reset";

export interface BuildHostShellHtmlInput {
  diagnostics?: readonly DiagnosticLine[];
  extensionUri: Uri;
  renderFailed: string;
  renderSucceeded: string;
  useCustomFind: boolean;
  webview: Webview;
}

/** Host document for first-open render failure (Open Output bridge). */
export async function buildHostShellHtml(
  input: BuildHostShellHtmlInput
): Promise<string> {
  const csp = [
    "default-src 'none'",
    `style-src 'unsafe-inline' ${input.webview.cspSource}`,
    "script-src 'unsafe-inline'",
  ].join("; ");
  const webviewJs = await readFile(
    Uri.joinPath(input.extensionUri, "dist", "webview.js").fsPath,
    "utf8"
  );
  const diagnosticsHtml =
    input.diagnostics && input.diagnostics.length > 0
      ? `<pre data-airp-host-diagnostics>${escapeHtml(
          input.diagnostics.map((line) => line.body).join("\n")
        )}</pre>`
      : "<pre data-airp-host-diagnostics hidden></pre>";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="${escapeHtml(csp)}" />
<title>AIRP Renderer</title>
<style>
${WEBVIEW_HOST_CSS}
[data-airp-host-shell]{max-width:40rem;margin:3rem auto;padding:0 1.25rem}
[data-airp-host-status]{font-size:1rem;font-weight:600;margin:0 0 1rem}
[data-airp-host-diagnostics]{white-space:pre-wrap;font:0.8rem/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;padding:0.75rem;border-radius:0.5rem;border:1px solid color-mix(in oklab, CanvasText 18%, transparent);background:color-mix(in oklab, CanvasText 4%, Canvas)}
[data-airp-open-output]{display:inline-block;margin-top:0.75rem;color:#0ea5e9}
</style>
<script>${WEBVIEW_REMOVE_DEFAULT_STYLES_JS}</script>
</head>
<body>
<main data-airp-host-shell data-mode="error">
<p data-airp-host-status>${escapeHtml(
    "Render failed. See diagnostics below or open the Output channel."
  )}</p>
${diagnosticsHtml}
<a href="#" data-airp-open-output>Open Output</a>
</main>
<div hidden data-airp-host-toast-copy data-succeeded="${escapeHtml(input.renderSucceeded)}" data-failed="${escapeHtml(input.renderFailed)}"></div>
${customFindMarkerHtml(input.useCustomFind)}
<div id="toaster" class="airp-toaster"></div>
<script>${webviewJs}</script>
</body>
</html>`;
}
