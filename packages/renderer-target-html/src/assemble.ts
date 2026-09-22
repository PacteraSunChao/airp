import { buildHtmlClientScript } from "./client/build-client-script.js";
import { buildColorSchemeApplyScript } from "./client/color-scheme-script.js";
import { htmlLocaleMessage } from "./i18n/html-locale.js";
import { renderIcon, renderIconSprite } from "./icons/render-icon.js";
import { escapeHtml } from "./shared/escape-html.js";
import { resolveHtmlTargetOptions } from "./shared/target-options.js";
import { renderMain } from "./shell/main/render.js";
import htmlStyles from "./styles/input.css?inline";

export interface AssembleHtmlDocumentOptions {
  bodyHtml: string;
  locale: string;
  pageTocHtml?: string;
  /** Document `schemaVersion` from airp.json (footer protocol label). */
  schemaVersion: string;
  targetOptions?: Readonly<Record<string, unknown>>;
  title: string;
}

/** Build a self-contained offline HTML document. */
export function assembleHtmlDocument(
  options: AssembleHtmlDocumentOptions
): string {
  const resolved = resolveHtmlTargetOptions(options.targetOptions);
  const title =
    options.title.trim().length > 0
      ? options.title
      : htmlLocaleMessage("assemble.default-name", options.locale);
  const main = renderMain({
    locale: options.locale,
    bodyHtml: options.bodyHtml,
    pageTocHtml: options.pageTocHtml,
    schemaVersion: options.schemaVersion,
    extraAppHeader: resolved.extraAppHeader,
  });
  const scripts = buildHtmlClientScript({
    labels: {
      light: htmlLocaleMessage(
        "client.color-scheme-script.light",
        options.locale
      ),
      dark: htmlLocaleMessage(
        "client.color-scheme-script.dark",
        options.locale
      ),
    },
    icons: {
      light: renderIcon("sun", { className: "size-4 shrink-0" }),
      dark: renderIcon("moon", { className: "size-4 shrink-0" }),
    },
    copyIcons: {
      copy: renderIcon("copy", { className: "size-3.5 shrink-0" }),
      check: renderIcon("check", { className: "size-3.5 shrink-0" }),
    },
    copyLabel: htmlLocaleMessage(
      "client.code-copy-script.label",
      options.locale
    ),
    copiedLabel: htmlLocaleMessage(
      "client.code-copy-script.copied",
      options.locale
    ),
  });
  const lang = escapeHtml(options.locale);
  const extraHeadPre = resolved.extraHeadPre ?? "";
  const extraHead = resolved.extraHead ?? "";
  const extraBody = resolved.extraBody ?? "";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
${extraHeadPre}
<script id="airp-color-scheme-apply">${buildColorSchemeApplyScript()}</script>
<style>${htmlStyles}</style>
${extraHead}
</head>
<body class="min-h-screen flex flex-col font-sans">
${renderIconSprite()}
${main}
<script>${scripts}</script>
${extraBody}
</body>
</html>
`;
}
