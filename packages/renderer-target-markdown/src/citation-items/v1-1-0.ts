/**
 * schema 1.1.0 citation lines: display uses order `[1]` `[2]`…;
 * machine handle `@id` is not shown.
 */
export function citationItemsMd110(items: unknown[]): string {
  return items
    .map((raw, index) => {
      const item = raw as { locator?: string; source: string };
      return `- [${index + 1}] ${item.source}${item.locator ? ` (${item.locator})` : ""}\n`;
    })
    .join("")
    .concat("\n");
}
