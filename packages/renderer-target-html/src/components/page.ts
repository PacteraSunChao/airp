/**
 * Sole HTML content-page exit: join non-empty parts into the open page stack.
 */

function wrapPageStack(bodyHtml: string): string {
  return `<article class="min-w-0 space-y-8 sm:space-y-12">${bodyHtml}</article>`;
}

/** Assemble content-page HTML from non-empty section parts. */
export function assemblePage(parts: readonly string[]): string {
  const body = parts.filter((part) => part.length > 0).join("");
  if (body.length === 0) {
    return "";
  }
  return wrapPageStack(body);
}
