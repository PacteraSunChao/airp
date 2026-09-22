/** Minimal ctx for section-anchor (avoids import cycle with emit-helpers). */
export interface SectionAnchorCtx {
  sectionIds: Set<string>;
}

const SECTION_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * Slug a section title into a protocol-safe anchor id; ensure uniqueness.
 * Used by schema 1.0.0 (and unit tests).
 */
export function allocateSectionId(
  ctx: SectionAnchorCtx,
  explicitId: unknown,
  title: string
): string {
  const fromExplicit =
    typeof explicitId === "string" && SECTION_ID_PATTERN.test(explicitId)
      ? explicitId
      : null;
  let base =
    fromExplicit ??
    title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  if (!SECTION_ID_PATTERN.test(base)) {
    base = `section-${ctx.sectionIds.size + 1}`;
  }
  let candidate = base;
  let suffix = 2;
  while (ctx.sectionIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  ctx.sectionIds.add(candidate);
  return candidate;
}

/**
 * schema 1.0.0 section anchor: explicit `id` when protocol-safe, else slug from title.
 */
export function sectionAnchor100(
  ctx: SectionAnchorCtx,
  block: { id?: unknown; [key: string]: unknown },
  titleText: string
): string {
  return allocateSectionId(ctx, block.id, titleText);
}

export { SECTION_ID_PATTERN };
