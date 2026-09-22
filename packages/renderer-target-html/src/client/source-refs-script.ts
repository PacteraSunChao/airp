/** Hydrate the viewport-aware document sources menu popover. */
export function buildSourceRefsScript(): string {
  return `(function () {
  var VIEWPORT_MARGIN = 12;
  var POPOVER_GAP = 8;
  var CLOSE_DELAY_MS = 260;

  function supportsHover() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );
  }

  function isOpen(root) {
    return root.getAttribute("data-open") !== null;
  }

  function setOpen(root, open) {
    var trigger = root.querySelector("[data-doc-sources-menu-trigger]");
    var popover = root.querySelector("[data-doc-sources-menu-panel]");
    if (open) {
      root.setAttribute("data-open", "");
    } else {
      root.removeAttribute("data-open");
    }
    if (trigger) {
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    }
    if (popover) {
      popover.setAttribute("aria-hidden", open ? "false" : "true");
    }
  }

  function positionPopover(root) {
    if (!isOpen(root)) return;
    var trigger = root.querySelector("[data-doc-sources-menu-trigger]");
    var popover = root.querySelector("[data-doc-sources-menu-panel]");
    if (!(trigger && popover)) return;

    var rect = trigger.getBoundingClientRect();
    var width = popover.offsetWidth;
    var left = Math.min(
      window.innerWidth - width - VIEWPORT_MARGIN,
      Math.max(VIEWPORT_MARGIN, rect.right - width)
    );
    var below = window.innerHeight - rect.bottom - POPOVER_GAP - VIEWPORT_MARGIN;
    var above = rect.top - POPOVER_GAP - VIEWPORT_MARGIN;
    var useAbove = below < Math.min(popover.scrollHeight, 280) && above > below;
    var available = Math.max(120, useAbove ? above : below);
    var height = Math.min(popover.scrollHeight, available);
    var top = useAbove
      ? Math.max(VIEWPORT_MARGIN, rect.top - POPOVER_GAP - height)
      : rect.bottom + POPOVER_GAP;

    popover.style.left = Math.round(left) + "px";
    popover.style.top = Math.round(top) + "px";
    popover.style.maxHeight = Math.floor(available) + "px";
  }

  function initSourceRefs(root) {
    if (root.dataset.docSourcesMenuInitialized === "true") return;
    var trigger = root.querySelector("[data-doc-sources-menu-trigger]");
    var popover = root.querySelector("[data-doc-sources-menu-panel]");
    if (!(trigger && popover)) return;
    var closeTimer = null;

    function cancelClose() {
      if (closeTimer === null) return;
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }

    function closeNow() {
      cancelClose();
      setOpen(root, false);
    }

    function openNow() {
      cancelClose();
      setOpen(root, true);
      positionPopover(root);
    }

    function scheduleClose() {
      cancelClose();
      closeTimer = window.setTimeout(function () {
        closeTimer = null;
        setOpen(root, false);
      }, CLOSE_DELAY_MS);
    }

    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      if (isOpen(root)) {
        closeNow();
      } else {
        openNow();
      }
    });
    root.addEventListener("pointerenter", function (event) {
      if (!(supportsHover() && event.pointerType === "mouse")) return;
      openNow();
    });
    root.addEventListener("pointerleave", function (event) {
      if (!(supportsHover() && event.pointerType === "mouse")) return;
      scheduleClose();
    });
    popover.addEventListener("pointerenter", function (event) {
      if (!(supportsHover() && event.pointerType === "mouse")) return;
      openNow();
    });
    popover.addEventListener("pointerleave", function (event) {
      if (!(supportsHover() && event.pointerType === "mouse")) return;
      scheduleClose();
    });
    root.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !isOpen(root)) return;
      event.preventDefault();
      closeNow();
      trigger.focus();
    });
    window.addEventListener("resize", function () {
      positionPopover(root);
    });
    window.addEventListener(
      "scroll",
      function () {
        positionPopover(root);
      },
      true
    );
    document.addEventListener("pointerdown", function (event) {
      if (isOpen(root) && !root.contains(event.target)) closeNow();
    });

    root.dataset.docSourcesMenuInitialized = "true";
  }

  function boot() {
    var nodes = document.querySelectorAll(
      "[data-doc-sources-menu]:not([data-doc-sources-menu-initialized])"
    );
    for (var i = 0; i < nodes.length; i += 1) {
      initSourceRefs(nodes[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();`;
}
