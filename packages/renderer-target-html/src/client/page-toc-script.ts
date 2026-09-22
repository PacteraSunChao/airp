/**
 * Page TOC: keep a fixed viewport top, sit in the main-column gutter, highlight
 * the active section, and share one top-right anchor for mini/panel.
 *
 * Fine pointer: hover to expand, leave with a grace delay.
 * Coarse / touch (pad): tap metaphorical TOC to expand; tap outside to dismiss.
 * Keep open after in-panel chapter clicks while the pointer stays inside.
 */
export function buildPageTocScript(): string {
  return `(function () {
  var ACTIVATION_OFFSET_PX = 88;
  var CLICK_LOCK_MS = 500;
  var HOVER_OUT_DELAY_MS = 350;
  var MIN_RIGHT_PX = 8;
  var CONTENT_GAP_PX = 16;
  var VIEWPORT_BOTTOM_GAP_PX = 16;
  var DESKTOP_MQ = "(min-width: 768px)";

  function isDesktop() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia(DESKTOP_MQ).matches
    );
  }

  function supportsHover() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );
  }

  /** Pads / phones: prefer tap-to-toggle even when hover media is true. */
  function preferClickToggle() {
    if (!supportsHover()) return true;
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches
    );
  }

  /** Sit in the gutter just outside \`main\`, not at the far viewport edge. */
  function resolveRightOffset(root) {
    var main = document.querySelector('main[data-route-path="/"]');
    if (!(main instanceof HTMLElement)) return MIN_RIGHT_PX;
    var mainRight = main.getBoundingClientRect().right;
    var shellWidth = Math.max(root.offsetWidth || 0, 20);
    var right = Math.round(
      window.innerWidth - mainRight - CONTENT_GAP_PX - shellWidth
    );
    return Math.max(MIN_RIGHT_PX, right);
  }

  function syncLayout(root) {
    if (!isDesktop()) return;
    root.style.right = resolveRightOffset(root) + "px";
    var panel = root.querySelector("[data-page-toc-panel]");
    if (panel instanceof HTMLElement) {
      var top = root.getBoundingClientRect().top;
      var avail = Math.max(
        120,
        window.innerHeight - top - VIEWPORT_BOTTOM_GAP_PX
      );
      panel.style.maxHeight = Math.floor(avail) + "px";
    }
  }

  function initPageToc(root) {
    if (root.dataset.pageTocInitialized === "true") return;
    root.dataset.pageTocInitialized = "true";

    var ticks = Array.prototype.slice.call(
      root.querySelectorAll("[data-page-toc-tick]")
    );
    var items = Array.prototype.slice.call(
      root.querySelectorAll("[data-page-toc-item]")
    );
    if (ticks.length === 0) return;

    var sections = ticks
      .map(function (tick) {
        var href = tick.getAttribute("href") || "";
        var id = href.charAt(0) === "#" ? href.slice(1) : "";
        if (!id) return null;
        var el = document.getElementById(id);
        return el ? { id: id, el: el } : null;
      })
      .filter(Boolean);

    if (sections.length === 0) return;

    var lockedId = null;
    var unlockTimer = null;
    var closeTimer = null;
    var pointerInside = false;
    var clickToggle = preferClickToggle();

    function isOpen() {
      return root.getAttribute("data-page-toc-open") === "true";
    }

    function cancelClose() {
      if (closeTimer === null) return;
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }

    function openPanel() {
      cancelClose();
      root.setAttribute("data-page-toc-open", "true");
    }

    function closePanel() {
      cancelClose();
      root.removeAttribute("data-page-toc-open");
    }

    function scheduleClose() {
      cancelClose();
      closeTimer = window.setTimeout(function () {
        closeTimer = null;
        if (pointerInside) return;
        root.removeAttribute("data-page-toc-open");
      }, HOVER_OUT_DELAY_MS);
    }

    function setActive(id) {
      for (var i = 0; i < ticks.length; i += 1) {
        var tick = ticks[i];
        var tickHref = tick.getAttribute("href") || "";
        var tickId = tickHref.charAt(0) === "#" ? tickHref.slice(1) : "";
        if (tickId === id) {
          tick.setAttribute("data-toc-active", "true");
          tick.setAttribute("aria-current", "location");
        } else {
          tick.removeAttribute("data-toc-active");
          tick.removeAttribute("aria-current");
        }
      }
      for (var j = 0; j < items.length; j += 1) {
        var item = items[j];
        var itemHref = item.getAttribute("href") || "";
        var itemId = itemHref.charAt(0) === "#" ? itemHref.slice(1) : "";
        if (itemId === id) {
          item.setAttribute("data-toc-active", "true");
          item.setAttribute("aria-current", "location");
        } else {
          item.removeAttribute("data-toc-active");
          item.removeAttribute("aria-current");
        }
      }
    }

    function resolveActiveId() {
      if (lockedId) return lockedId;
      var activeId = sections[0].id;
      for (var i = 0; i < sections.length; i += 1) {
        var top = sections[i].el.getBoundingClientRect().top;
        if (top <= ACTIVATION_OFFSET_PX) {
          activeId = sections[i].id;
        }
      }
      return activeId;
    }

    function updateActive() {
      setActive(resolveActiveId());
    }

    function lockActive(id) {
      lockedId = id;
      setActive(id);
      if (unlockTimer !== null) {
        window.clearTimeout(unlockTimer);
      }
      unlockTimer = window.setTimeout(function () {
        unlockTimer = null;
        lockedId = null;
        updateActive();
      }, CLICK_LOCK_MS);
    }

    if (!clickToggle) {
      root.addEventListener("pointerenter", function (event) {
        if (event.pointerType !== "mouse") return;
        pointerInside = true;
        openPanel();
      });
      root.addEventListener("pointerleave", function (event) {
        if (event.pointerType !== "mouse") return;
        pointerInside = false;
        scheduleClose();
      });
    }

    root.addEventListener("focusin", function () {
      if (clickToggle) return;
      openPanel();
    });
    root.addEventListener("focusout", function (event) {
      if (clickToggle) return;
      var next = event.relatedTarget;
      if (next instanceof Node && root.contains(next)) return;
      if (pointerInside) return;
      scheduleClose();
    });
    root.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (!isOpen()) return;
      event.preventDefault();
      closePanel();
    });

    root.addEventListener("click", function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;
      var link = target.closest("[data-page-toc-tick], [data-page-toc-item]");
      if (!link || !root.contains(link)) return;
      var href = link.getAttribute("href") || "";
      if (href.charAt(0) !== "#") return;

      if (clickToggle) {
        if (!isOpen()) {
          event.preventDefault();
          openPanel();
          return;
        }
        cancelClose();
        lockActive(href.slice(1));
        return;
      }

      cancelClose();
      if (pointerInside) openPanel();
      lockActive(href.slice(1));
    });

    if (clickToggle) {
      document.addEventListener(
        "pointerdown",
        function (event) {
          if (!isOpen()) return;
          if (!(event.target instanceof Node)) return;
          if (root.contains(event.target)) return;
          closePanel();
        },
        true
      );
    }

    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", function () {
      syncLayout(root);
      updateActive();
    });
    syncLayout(root);
    updateActive();
  }

  function boot() {
    var roots = document.querySelectorAll("[data-page-toc]");
    for (var i = 0; i < roots.length; i += 1) {
      initPageToc(roots[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();`;
}
