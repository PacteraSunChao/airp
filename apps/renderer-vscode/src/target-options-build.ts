import { readFile } from "node:fs/promises";
import { Uri, type Webview } from "vscode";
import {
  buildColorSchemePrefillScript,
  type ColorSchemePref,
} from "./color-scheme";
import { customFindMarkerHtml } from "./custom-find-marker";
import { escapeHtml } from "./escape-html";
import { buildAppHeader } from "./reader-header";
import { webviewHostHeadExtras } from "./webview-code-reset";

export interface BuildTargetOptionsInput {
  colorScheme: ColorSchemePref;
  extensionUri: Uri;
  renderFailed: string;
  renderSucceeded: string;
  useCustomFind: boolean;
  webview: Webview;
}

export interface BuiltTargetOptions {
  extraAppHeader: string;
  extraBody: string;
  extraHead: string;
  extraHeadPre: string;
}

/** Assemble HTML targetOptions for the Renderer view document. */
export async function buildTargetOptions(
  input: BuildTargetOptionsInput
): Promise<BuiltTargetOptions> {
  const csp = buildCsp(input.webview);
  const webviewJs = await readFile(
    Uri.joinPath(input.extensionUri, "dist", "webview.js").fsPath,
    "utf8"
  );
  const toastCopy = `<div hidden data-airp-host-toast-copy data-succeeded="${escapeHtml(input.renderSucceeded)}" data-failed="${escapeHtml(input.renderFailed)}"></div>`;
  const customFind = customFindMarkerHtml(input.useCustomFind);
  return {
    extraHeadPre: buildColorSchemePrefillScript(input.colorScheme),
    extraHead: `<meta http-equiv="Content-Security-Policy" content="${escapeHtml(csp)}" />\n${webviewHostHeadExtras()}`,
    extraBody: `${toastCopy}\n${customFind}\n<div id="toaster" class="airp-toaster"></div>\n<script>${webviewJs}</script>`,
    extraAppHeader: buildAppHeader(),
  };
}

function buildCsp(webview: Webview): string {
  return [
    "default-src 'none'",
    `style-src 'unsafe-inline' ${webview.cspSource}`,
    "script-src 'unsafe-inline'",
    `img-src ${webview.cspSource} data:`,
    `font-src ${webview.cspSource} data:`,
  ].join("; ");
}
