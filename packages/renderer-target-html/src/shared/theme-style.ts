/** Shared CSS variable style fragments for themed surfaces (emit + shell). */

export const styleBorder = "border-color: var(--border-color)";
export const styleBorderSubtle = "border-color: var(--border-subtle)";
export const stylePage =
  "background-color: var(--bg-page); color: var(--text-main)";
export const styleSurface = "background-color: var(--bg-surface)";
export const styleSubtle = "background-color: var(--bg-subtle)";
export const styleTextMain = "color: var(--text-main)";
export const styleTextSecondary = "color: var(--text-secondary)";
export const styleTextMuted = "color: var(--text-muted)";

/** Join style fragments into a single attribute value. */
export function styles(...parts: string[]): string {
  return parts.filter((part) => part.length > 0).join("; ");
}
