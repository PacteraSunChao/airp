/** localStorage key for color-scheme preference (omit when light / default). */
export const APP_COLOR_SCHEME_KEY = "airp-app-color-scheme";

/**
 * Document event to apply a color-scheme preference (detail: `"light"` | `"dark"`).
 * Hosts dispatch this; the color-scheme client script handles paint + storage.
 */
export const COLOR_SCHEME_EVENT = "airp-color-scheme";

/** Persist pan/zoom prefs for one `.svg-viewer` instance. */
export function svgViewerStorageKey(
  routePath: string,
  instance: string
): string {
  return `airp-svg-viewer:${routePath}:${instance}`;
}

/** Persist open state for one `collapsible` block. */
export function collapsibleStorageKey(
  routePath: string,
  instance: string
): string {
  return `airp-collapsible:${routePath}:${instance}`;
}

/** Persist the selected panel for one `tabs` block. */
export function tabsStorageKey(routePath: string, instance: string): string {
  return `airp-tabs:${routePath}:${instance}`;
}
