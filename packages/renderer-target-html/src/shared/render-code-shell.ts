import { escapeHtml } from "./escape-html.js";

/** Escape plain code and wrap each line for line-number CSS. */
export function renderPlainCodePre(
  code: string,
  language: string | undefined
): string {
  const langClass = language ? ` class="language-${escapeHtml(language)}"` : "";
  const lines = code.length === 0 ? [""] : code.split("\n");
  const body = lines
    .map((line) => `<span class="line">${escapeHtml(line)}</span>`)
    .join("\n");
  return `<pre class="m-0 overflow-x-auto bg-transparent p-0"><code${langClass}>${body}</code></pre>`;
}

/** Filename row + optional language + copy around body. */
export function renderCodeShell(options: {
  bodyHtml: string;
  filename?: string;
  language?: string;
}): string {
  const filename =
    typeof options.filename === "string" && options.filename.length > 0
      ? `<code class="truncate font-mono text-xs font-medium" data-code-filename="true" style="color: var(--text-main)">${escapeHtml(options.filename)}</code>`
      : `<span data-code-filename="true"></span>`;
  const language =
    typeof options.language === "string" && options.language.length > 0
      ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono border" data-code-lang="true" style="color: var(--text-secondary); background-color: var(--bg-subtle); border-color: var(--border-color)">${escapeHtml(options.language)}</span>`
      : "";
  const chrome = `<div class="flex items-center justify-between px-4 py-2.5 border-b" style="border-color: var(--border-color); background-color: var(--bg-surface)"><div class="flex items-center gap-2 min-w-0">${filename}${language}</div><button type="button" class="airp-code-copy airp-interactive inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded border" data-code-copy aria-label="Copy" style="color: var(--text-secondary); background-color: var(--bg-surface); border-color: var(--border-color)"></button></div>`;
  return `${chrome}<div class="p-4 overflow-x-auto leading-relaxed">${options.bodyHtml}</div>`;
}
