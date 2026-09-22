/** Persist `<details>` open state for collapsible blocks. */
export function buildCollapsibleScript(): string {
  return `(function () {
  function storage() {
    return window.__airpStorage;
  }

  function storageKeyFor(root) {
    var key = root.getAttribute("data-storage-key");
    return key && key.trim() ? key.trim() : "";
  }

  function defaultOpenFor(root) {
    return root.getAttribute("data-default-open") === "true";
  }

  function readStoredOpen(root) {
    var key = storageKeyFor(root);
    var api = storage();
    if (!(key && api)) {
      return null;
    }
    var raw = api.readJson(key, null);
    if (!(raw && typeof raw === "object")) {
      return null;
    }
    return typeof raw.open === "boolean" ? raw.open : null;
  }

  function syncPrefs(root) {
    var key = storageKeyFor(root);
    var api = storage();
    if (!(key && api)) {
      return;
    }
    var open = Boolean(root.open);
    if (open === defaultOpenFor(root)) {
      if (typeof api.remove === "function") {
        api.remove(key);
      }
      return;
    }
    api.writeJson(key, { open: open });
  }

  function hydrate(root) {
    if (root.dataset.collapsibleInitialized === "true") {
      return;
    }
    var stored = readStoredOpen(root);
    if (stored !== null) {
      if (stored === defaultOpenFor(root)) {
        var key = storageKeyFor(root);
        var api = storage();
        if (key && api && typeof api.remove === "function") {
          api.remove(key);
        }
      } else {
        root.open = stored;
      }
    }
    root.addEventListener("toggle", function () {
      syncPrefs(root);
    });
    root.dataset.collapsibleInitialized = "true";
  }

  function boot() {
    var roots = document.querySelectorAll(
      '[data-block-type="collapsible"][data-storage-key]:not([data-collapsible-initialized])'
    );
    for (var i = 0; i < roots.length; i += 1) {
      hydrate(roots[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();`;
}
