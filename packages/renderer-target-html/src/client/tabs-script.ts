/** Hydrate accessible tabs blocks emitted by the HTML target. */
export function buildTabsScript(): string {
  return `(function () {
  function storage() {
    return window.__airpStorage;
  }

  function ownedNodes(root, selector) {
    var candidates = root.querySelectorAll(selector);
    var owned = [];
    for (var i = 0; i < candidates.length; i += 1) {
      if (candidates[i].closest('[data-block-type="tabs"]') === root) {
        owned.push(candidates[i]);
      }
    }
    return owned;
  }

  function storageKeyFor(root) {
    var key = root.getAttribute("data-storage-key");
    return key && key.trim() ? key.trim() : "";
  }

  function defaultPanelFor(root) {
    return root.getAttribute("data-default-panel") || "";
  }

  function panelKeyFor(tab) {
    return tab.getAttribute("data-tabs-panel-key") || "";
  }

  function readStoredPanel(root) {
    var key = storageKeyFor(root);
    var api = storage();
    if (!(key && api)) return "";
    var raw = api.readJson(key, null);
    if (!(raw && typeof raw === "object")) return "";
    return typeof raw.panel === "string" ? raw.panel : "";
  }

  function writeStoredPanel(root, panel) {
    var key = storageKeyFor(root);
    var api = storage();
    if (!(key && api)) return;
    if (panel === defaultPanelFor(root)) {
      if (typeof api.remove === "function") api.remove(key);
      return;
    }
    api.writeJson(key, { panel: panel });
  }

  function initTabs(root) {
    if (root.dataset.tabsInitialized === "true") return;
    var tabs = ownedNodes(root, "[data-tabs-tab]");
    var panels = ownedNodes(root, "[data-tabs-panel]");
    if (tabs.length === 0 || tabs.length !== panels.length) return;

    function activate(index, focus, persist) {
      for (var i = 0; i < tabs.length; i += 1) {
        var selected = i === index;
        tabs[i].setAttribute("aria-selected", selected ? "true" : "false");
        tabs[i].tabIndex = selected ? 0 : -1;
        panels[i].hidden = !selected;
      }
      if (focus) tabs[index].focus();
      if (persist) writeStoredPanel(root, panelKeyFor(tabs[index]));
    }

    function onKeyDown(event) {
      var current = tabs.indexOf(event.currentTarget);
      var next = current;
      if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(next, true, true);
    }

    for (var i = 0; i < tabs.length; i += 1) {
      (function (index) {
        tabs[index].addEventListener("click", function () {
          activate(index, false, true);
        });
        tabs[index].addEventListener("keydown", onKeyDown);
      })(i);
    }
    var initialIndex = 0;
    var storedPanel = readStoredPanel(root);
    if (storedPanel) {
      initialIndex = tabs.findIndex(function (tab) {
        return panelKeyFor(tab) === storedPanel;
      });
      if (initialIndex < 0 || storedPanel === defaultPanelFor(root)) {
        var key = storageKeyFor(root);
        var api = storage();
        if (key && api && typeof api.remove === "function") api.remove(key);
        initialIndex = 0;
      }
    }
    activate(initialIndex, false, false);
    root.dataset.tabsInitialized = "true";
  }

  function boot() {
    var nodes = document.querySelectorAll(
      '[data-block-type="tabs"]:not([data-tabs-initialized])'
    );
    for (var i = 0; i < nodes.length; i += 1) {
      initTabs(nodes[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();`;
}
