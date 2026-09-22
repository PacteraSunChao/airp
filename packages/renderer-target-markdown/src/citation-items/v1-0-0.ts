/** schema 1.0.0 citation lines: display uses business `id`. */
export function citationItemsMd100(items: unknown[]): string {
  return items
    .map((raw) => {
      const item = raw as { id: string; locator?: string; source: string };
      return `- [${item.id}] ${item.source}${item.locator ? ` (${item.locator})` : ""}\n`;
    })
    .join("")
    .concat("\n");
}
