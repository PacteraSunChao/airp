/**
 * Host-private styles for the export dropdown, Cursor find bar, and toast.
 * Export menu chrome matches the document sources popover (rounded-xl, p-2,
 * --shadow-float, slate row hover). Open motion uses reader `.airp-float-panel`
 * (same 160ms fade/scale as page TOC) via `[data-open]`. Color-scheme toggle is
 * hidden: the Renderer view follows the VS Code theme.
 */
export function hostInjectedCss(): string {
  return `
html{scroll-behavior:auto!important}
#app-color-scheme-toggle{display:none!important}
[data-extra-app-header]{display:contents}
[data-airp-export]{position:relative;display:inline-flex;align-items:center;align-self:center;line-height:0}
[data-airp-export-menu]{position:absolute;top:100%;right:0;margin-top:0.5rem;min-width:12rem;overflow:hidden;padding:0.5rem;border-radius:0.75rem;border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-main);box-shadow:var(--shadow-float);z-index:70}
[data-airp-export-menu-header]{display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.625rem;border-bottom:1px solid var(--border-subtle);font-size:0.75rem;font-weight:600;color:var(--text-main)}
[data-airp-export-menu-header] svg{color:#0ea5e9;flex-shrink:0}
[data-airp-export-menu-items]{padding-top:0.25rem}
[data-airp-export-format]{display:flex;width:100%;align-items:center;gap:0.75rem;text-align:left;padding:0.5rem 0.625rem;border:0;border-radius:0.5rem;background:transparent;color:var(--text-main);cursor:pointer;font:inherit;font-size:0.75rem;font-weight:500;line-height:1.25}
[data-airp-export-format]:hover,[data-airp-export-format]:focus-visible{background:#f8fafc}
html.dark [data-airp-export-format]:hover,html.dark [data-airp-export-format]:focus-visible{background:rgb(30 41 59 / 0.6)}
[data-airp-find-bar]{position:fixed;top:0.75rem;right:0.75rem;z-index:80;display:flex;align-items:center;gap:0.35rem;padding:0.4rem 0.5rem;border-radius:0.75rem;border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-main);box-shadow:var(--shadow-float);font:inherit;font-size:0.75rem}
[data-airp-find-bar][hidden]{display:none!important}
[data-airp-find-input]{width:12rem;min-width:0;margin:0;padding:0.35rem 0.5rem;border-radius:0.5rem;border:1px solid var(--border-color);background:var(--bg-subtle);color:var(--text-main);font:inherit;font-size:0.75rem;line-height:1.25}
[data-airp-find-input]:focus{outline:2px solid color-mix(in oklab,#0ea5e9 55%,transparent);outline-offset:1px}
[data-airp-find-count]{min-width:2.5rem;text-align:center;color:var(--text-secondary);font-variant-numeric:tabular-nums}
[data-airp-find-prev],[data-airp-find-next],[data-airp-find-close]{display:inline-flex;align-items:center;justify-content:center;min-width:1.75rem;height:1.75rem;padding:0 0.35rem;border-radius:0.5rem;border:1px solid var(--border-color);background:var(--bg-subtle);color:var(--text-secondary);cursor:pointer;font:inherit;font-size:0.75rem;line-height:1}
[data-airp-find-prev]:hover,[data-airp-find-next]:hover,[data-airp-find-close]:hover,[data-airp-find-prev]:focus-visible,[data-airp-find-next]:focus-visible,[data-airp-find-close]:focus-visible{background:#f8fafc;color:var(--text-main)}
html.dark [data-airp-find-prev]:hover,html.dark [data-airp-find-next]:hover,html.dark [data-airp-find-close]:hover,html.dark [data-airp-find-prev]:focus-visible,html.dark [data-airp-find-next]:focus-visible,html.dark [data-airp-find-close]:focus-visible{background:rgb(30 41 59 / 0.6)}
[data-airp-find-overlay]{position:fixed;inset:0;z-index:75;pointer-events:none;overflow:hidden}
[data-airp-find-hit]{position:absolute;box-sizing:border-box;border:2px solid #ca8a04;border-radius:2px;background:transparent;box-shadow:0 0 0 1px color-mix(in oklab,#ca8a04 55%,transparent)}
[data-airp-find-hit][data-current]{border-width:2.5px;border-color:#ea580c;box-shadow:0 0 0 2px color-mix(in oklab,#ea580c 50%,transparent)}
.airp-toaster{position:fixed;right:1rem;bottom:1rem;z-index:100;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none}
.airp-toast{pointer-events:auto;display:flex;align-items:flex-start;gap:0.5rem;min-width:12rem;max-width:20rem;padding:0.75rem 0.9rem;border-radius:0.75rem;border:1px solid var(--border-color);background:var(--bg-surface);color:var(--text-main);box-shadow:var(--shadow-float)}
.airp-toast[data-category="error"]{border-color:#ef4444}
.airp-toast[data-category="success"]{border-color:#22c55e}
.airp-toast h2{margin:0;font-size:0.875rem;font-weight:600}
`.trim();
}
