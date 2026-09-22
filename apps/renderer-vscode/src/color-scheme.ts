/** Matches HTML `APP_COLOR_SCHEME_KEY` / `COLOR_SCHEME_EVENT`. */
export const APP_COLOR_SCHEME_KEY = "airp-app-color-scheme";
export const COLOR_SCHEME_EVENT = "airp-color-scheme";

export type ColorSchemePref = "light" | "dark";

/**
 * Map VS Code `ColorThemeKind` numeric values to the HTML binary preference.
 * Light=1, Dark=2, HighContrast=3, HighContrastLight=4.
 */
export function colorSchemeFromThemeKind(kind: number): ColorSchemePref {
  return kind === 2 || kind === 3 ? "dark" : "light";
}

/** Sync script for `extraHeadPre`: seed localStorage before color-scheme apply. */
export function buildColorSchemePrefillScript(pref: ColorSchemePref): string {
  const keyJson = JSON.stringify(APP_COLOR_SCHEME_KEY);
  const prefJson = JSON.stringify(pref);
  return `<script>(function () {
  var KEY = ${keyJson};
  var pref = ${prefJson};
  try {
    if (pref === "dark") {
      localStorage.setItem(KEY, JSON.stringify("dark"));
    } else {
      localStorage.removeItem(KEY);
    }
  } catch (error) {}
})();</script>`;
}
