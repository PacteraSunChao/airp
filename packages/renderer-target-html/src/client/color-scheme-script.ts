import {
  APP_COLOR_SCHEME_KEY,
  COLOR_SCHEME_EVENT,
} from "../shared/client-storage-keys.js";

const APPLY_HELPERS = `function applyHtmlDark(pref) {
  document.documentElement.classList.toggle("dark", pref === "dark");
}

function isColorSchemePref(value) {
  return value === "light" || value === "dark";
}`;

/** Head script: apply html.dark before paint. */
export function buildColorSchemeApplyScript(): string {
  const keyJson = JSON.stringify(APP_COLOR_SCHEME_KEY);
  return `(function () {
  ${APPLY_HELPERS}
  function readPrefFromStorage() {
    try {
      var raw = localStorage.getItem(${keyJson});
      if (raw == null) return "light";
      var parsed = JSON.parse(raw);
      if (parsed === "light") {
        try { localStorage.removeItem(${keyJson}); } catch (error) {}
        return "light";
      }
      if (isColorSchemePref(parsed)) return parsed;
    } catch (error) {}
    return "light";
  }
  applyHtmlDark(readPrefFromStorage());
})();`;
}

export interface ColorSchemeLabels {
  dark: string;
  light: string;
}

export interface ColorSchemeIcons {
  dark: string;
  light: string;
}

/** Body script: hydrate color-scheme toggle. */
export function buildColorSchemeScript(
  labels: ColorSchemeLabels,
  icons: ColorSchemeIcons
): string {
  const keyJson = JSON.stringify(APP_COLOR_SCHEME_KEY);
  const eventJson = JSON.stringify(COLOR_SCHEME_EVENT);
  const labelsJson = JSON.stringify(labels);
  const iconsJson = JSON.stringify(icons);
  return `(function () {
  ${APPLY_HELPERS}
  var KEY = ${keyJson};
  var EVENT = ${eventJson};
  var LABELS = ${labelsJson};
  var ICONS = ${iconsJson};
  var ORDER = ["light", "dark"];

  function readPref() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw == null) return "light";
      var parsed = JSON.parse(raw);
      if (parsed === "light") {
        try { localStorage.removeItem(KEY); } catch (error) {}
        return "light";
      }
      if (isColorSchemePref(parsed)) return parsed;
    } catch (error) {}
    return "light";
  }

  function writePref(pref) {
    try {
      if (pref === "light") {
        localStorage.removeItem(KEY);
      } else {
        localStorage.setItem(KEY, JSON.stringify(pref));
      }
    } catch (error) {}
  }

  function paint(button, pref) {
    button.setAttribute("data-color-scheme", pref);
    button.setAttribute("aria-label", LABELS[pref]);
    button.innerHTML = ICONS[pref] + '<span class="sr-only">' + LABELS[pref] + "</span>";
  }

  function applyPref(pref) {
    if (!isColorSchemePref(pref)) return;
    writePref(pref);
    applyHtmlDark(pref);
    var button = document.getElementById("app-color-scheme-toggle");
    if (button) paint(button, pref);
  }

  function boot() {
    var button = document.getElementById("app-color-scheme-toggle");
    if (!button) return;
    var pref = readPref();
    applyHtmlDark(pref);
    paint(button, pref);
    button.addEventListener("click", function () {
      var current = button.getAttribute("data-color-scheme") || "light";
      var next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
      applyPref(next);
    });
  }

  document.addEventListener(EVENT, function (event) {
    applyPref(event.detail);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();`;
}
