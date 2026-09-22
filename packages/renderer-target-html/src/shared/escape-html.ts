/** Escape text for HTML element / attribute context. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * JSON text safe to embed inside an HTML `<script>` element
 * (`<` → `\u003c` so `</script>` cannot close early).
 */
export function escapeJsonForHtmlEmbed(data: unknown): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}
