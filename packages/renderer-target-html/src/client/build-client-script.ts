import { buildClientStorageScript } from "./client-storage-script.js";
import type { CodeCopyIcons } from "./code-copy-script.js";
import { buildCodeCopyScript } from "./code-copy-script.js";
import { buildCollapsibleScript } from "./collapsible-script.js";
import type {
  ColorSchemeIcons,
  ColorSchemeLabels,
} from "./color-scheme-script.js";
import { buildColorSchemeScript } from "./color-scheme-script.js";
import { buildDocTimeScript } from "./doc-time-script.js";
import { buildPageTocScript } from "./page-toc-script.js";
import { buildSourceRefsScript } from "./source-refs-script.js";
import { buildSvgViewerScript } from "./svg-viewer-script.js";
import { buildTabsScript } from "./tabs-script.js";

export function buildHtmlClientScript(options: {
  copiedLabel: string;
  copyIcons: CodeCopyIcons;
  copyLabel: string;
  icons: ColorSchemeIcons;
  labels: ColorSchemeLabels;
}): string {
  return [
    buildClientStorageScript(),
    buildColorSchemeScript(options.labels, options.icons),
    buildSvgViewerScript(),
    buildCollapsibleScript(),
    buildTabsScript(),
    buildSourceRefsScript(),
    buildDocTimeScript(),
    buildPageTocScript(),
    buildCodeCopyScript({
      label: options.copyLabel,
      copiedLabel: options.copiedLabel,
      icons: options.copyIcons,
    }),
  ].join("\n");
}
