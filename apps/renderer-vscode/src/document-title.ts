/**
 * Resolve a panel-friendly title from `meta.title`
 * (plain string or locale map).
 */
export function resolveDocumentPanelTitle(
  metaTitle: unknown,
  fallback: string
): string {
  if (typeof metaTitle === "string") {
    const trimmed = metaTitle.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (metaTitle && typeof metaTitle === "object" && !Array.isArray(metaTitle)) {
    for (const value of Object.values(metaTitle as Record<string, unknown>)) {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }
  }
  return fallback;
}

/** Read `meta.title` from a loaded document object. */
export function documentTitleFromLoaded(
  document: Record<string, unknown>,
  fallback: string
): string {
  const meta = document.meta;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return fallback;
  }
  return resolveDocumentPanelTitle(
    (meta as { title?: unknown }).title,
    fallback
  );
}
