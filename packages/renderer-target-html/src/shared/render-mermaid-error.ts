import { escapeHtml } from "./escape-html.js";

/**
 * Callout `danger` style error block for a Mermaid render failure.
 * Observable via `data-mermaid-error="true"`.
 */
export function renderMermaidError(message: string): string {
  const escaped = escapeHtml(message);
  return `<div class="flex items-start gap-3 p-4 rounded-xl border bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200" data-mermaid-error="true" role="alert"><div class="text-xs sm:text-sm min-w-0 flex-1"><strong class="font-semibold block mb-0.5">Mermaid render failed</strong><pre class="whitespace-pre-wrap break-words font-mono text-[0.85em] m-0">${escaped}</pre></div></div>`;
}
