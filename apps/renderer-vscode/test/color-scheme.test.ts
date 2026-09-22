import { describe, expect, it } from "vitest";
import {
  APP_COLOR_SCHEME_KEY,
  buildColorSchemePrefillScript,
  colorSchemeFromThemeKind,
} from "../src/color-scheme";

describe("color-scheme", () => {
  it("maps VS Code ColorThemeKind to light or dark", () => {
    expect(colorSchemeFromThemeKind(1)).toBe("light");
    expect(colorSchemeFromThemeKind(4)).toBe("light");
    expect(colorSchemeFromThemeKind(2)).toBe("dark");
    expect(colorSchemeFromThemeKind(3)).toBe("dark");
  });

  it("builds a prefill script that seeds dark and clears light", () => {
    const dark = buildColorSchemePrefillScript("dark");
    expect(dark).toContain(APP_COLOR_SCHEME_KEY);
    expect(dark).toContain('var pref = "dark"');
    expect(dark).toContain("localStorage.setItem");

    const light = buildColorSchemePrefillScript("light");
    expect(light).toContain('var pref = "light"');
    expect(light).toContain("localStorage.removeItem");
  });
});
