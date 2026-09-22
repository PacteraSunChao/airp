import { renderIcon } from "../icons/render-icon.js";

function iconSvgJson(name: "plus" | "minus" | "rotate-ccw"): string {
  return JSON.stringify(
    renderIcon(name, {
      className: "size-3.5 shrink-0",
    })
  );
}

/** Pan/zoom + height resize for `.svg-viewer` shells. */
export function buildSvgViewerScript(): string {
  const plusIcon = iconSvgJson("plus");
  const minusIcon = iconSvgJson("minus");
  const resetIcon = iconSvgJson("rotate-ccw");

  return `(function () {
  var MIN_ZOOM = 0.35;
  var MAX_ZOOM = 3;
  var ZOOM_STEP = 0.15;
  var VIEWPORT_PADDING = 16;
  var DRAG_THRESHOLD_PX = 4;
  var MAX_HEIGHT_CAP_PX = 960;
  var plusIconSvg = ${plusIcon};
  var minusIconSvg = ${minusIcon};
  var resetIconSvg = ${resetIcon};

  function storage() {
    return window.__airpStorage;
  }

  function parseViewBox(svg) {
    var raw = svg.getAttribute("viewBox");
    if (!raw) {
      return {
        x: 0,
        y: 0,
        w: svg.clientWidth || 1,
        h: svg.clientHeight || 1,
      };
    }
    var parts = raw.trim().split(/\\s+/).map(Number);
    return {
      x: parts[0] || 0,
      y: parts[1] || 0,
      w: parts[2] || 1,
      h: parts[3] || 1,
    };
  }

  function storageKeyFor(root) {
    var key = root.getAttribute("data-storage-key");
    return key && key.trim() ? key.trim() : "";
  }

  function readPrefs(root) {
    var key = storageKeyFor(root);
    var api = storage();
    if (!(key && api)) {
      return {};
    }
    var raw = api.readJson(key, null);
    return raw && typeof raw === "object" ? raw : {};
  }

  function clearPrefs(root) {
    var key = storageKeyFor(root);
    var api = storage();
    if (!(key && api && typeof api.remove === "function")) {
      return;
    }
    api.remove(key);
  }

  function writePrefs(root, patch) {
    var key = storageKeyFor(root);
    var api = storage();
    if (!(key && api)) {
      return;
    }
    var current = readPrefs(root);
    var next = {};
    var prop;
    for (prop in current) {
      if (Object.prototype.hasOwnProperty.call(current, prop)) {
        next[prop] = current[prop];
      }
    }
    for (prop in patch) {
      if (Object.prototype.hasOwnProperty.call(patch, prop)) {
        if (patch[prop] === undefined || patch[prop] === null) {
          delete next[prop];
        } else {
          next[prop] = patch[prop];
        }
      }
    }
    if (Object.keys(next).length === 0) {
      if (typeof api.remove === "function") {
        api.remove(key);
      }
      return;
    }
    api.writeJson(key, next);
  }

  function minHeightFor(root) {
    var raw = Number(root.getAttribute("data-min-height"));
    return Number.isFinite(raw) && raw > 0 ? raw : 320;
  }

  function maxHeightPx() {
    return Math.min(MAX_HEIGHT_CAP_PX, Math.floor(window.innerHeight * 0.85));
  }

  function clampHeight(root, nextHeightPx) {
    return Math.max(
      minHeightFor(root),
      Math.min(maxHeightPx(), Math.round(nextHeightPx))
    );
  }

  function makeZoomButton(action, iconHtml) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "svg-viewer-zoom-btn";
    button.setAttribute("data-svg-viewer-" + action, "");
    button.innerHTML = iconHtml;
    return button;
  }

  function ensureStructure(root) {
    var existing = root.querySelector(":scope > [data-svg-viewer-surface]");
    if (existing) {
      return existing;
    }

    var svg = root.querySelector(":scope > svg");
    if (!svg) {
      return null;
    }

    var surface = document.createElement("div");
    surface.className = "svg-viewer-surface";
    surface.setAttribute("data-svg-viewer-surface", "");

    var heightStyle = root.style.height;
    if (heightStyle) {
      surface.style.height = heightStyle;
      root.style.removeProperty("height");
    } else {
      surface.style.height = String(minHeightFor(root)) + "px";
    }
    if (root.style.width) {
      surface.style.width = root.style.width;
      root.style.removeProperty("width");
    }

    var stage = document.createElement("div");
    stage.className = "svg-viewer-stage";
    stage.setAttribute("data-svg-viewer-stage", "");
    stage.appendChild(svg);

    var zoomHost = root.querySelector(":scope > [data-svg-viewer-chrome] [data-svg-viewer-zoom]");
    if (!zoomHost) {
      var chrome = root.querySelector(":scope > [data-svg-viewer-chrome]");
      if (!chrome) {
        chrome = document.createElement("div");
        chrome.className =
          "flex items-center justify-between px-4 py-2 border-b text-xs";
        chrome.setAttribute("data-svg-viewer-chrome", "");
        chrome.setAttribute(
          "style",
          "border-color: var(--border-color); background-color: var(--bg-subtle); color: var(--text-secondary)"
        );
        root.insertBefore(chrome, root.firstChild);
      }
      zoomHost = document.createElement("div");
      zoomHost.className = "flex items-center gap-1.5";
      zoomHost.setAttribute("data-svg-viewer-zoom", "");
      chrome.appendChild(zoomHost);
    }
    zoomHost.appendChild(makeZoomButton("zoom-in", plusIconSvg));
    zoomHost.appendChild(makeZoomButton("zoom-out", minusIconSvg));
    zoomHost.appendChild(makeZoomButton("zoom-reset", resetIconSvg));

    surface.appendChild(stage);

    var resize = document.createElement("button");
    resize.type = "button";
    resize.className = "svg-viewer-resize";
    resize.setAttribute("data-svg-viewer-resize", "");

    root.appendChild(surface);
    root.appendChild(resize);
    return surface;
  }

  function initSvgViewer(root) {
    if (!(root && root.nodeType === Node.ELEMENT_NODE)) {
      return;
    }
    if (root.dataset.svgViewerInitialized === "true") {
      return;
    }

    var surface = ensureStructure(root);
    if (!surface) {
      return;
    }

    var resize = root.querySelector(":scope > [data-svg-viewer-resize]");
    var stage = surface.querySelector(":scope > [data-svg-viewer-stage]");
    var svg = stage ? stage.querySelector("svg") : null;
    if (!(stage && svg)) {
      return;
    }

    var saved = readPrefs(root);
    var zoomIn = root.querySelector("[data-svg-viewer-zoom-in]");
    var zoomOut = root.querySelector("[data-svg-viewer-zoom-out]");
    var reset = root.querySelector("[data-svg-viewer-zoom-reset]");

    var vb = parseViewBox(svg);
    stage.style.width = String(vb.w) + "px";
    stage.style.height = String(vb.h) + "px";

    var state = {
      scale: 1,
      fitScale: 1,
      tx: VIEWPORT_PADDING,
      ty: VIEWPORT_PADDING,
      userAdjusted: false,
      panning: false,
      moved: false,
      startX: 0,
      startY: 0,
      startTx: 0,
      startTy: 0,
      resizing: false,
      resizeStartY: 0,
      resizeStartHeight: 0,
    };

    function applyHeight(heightPx) {
      surface.style.height = String(heightPx) + "px";
    }

    function currentHeight() {
      return surface.clientHeight;
    }

    function applyTransform(animate) {
      if (animate) {
        stage.classList.remove("svg-viewer-stage--no-transition");
      } else {
        stage.classList.add("svg-viewer-stage--no-transition");
      }
      stage.style.transform =
        "translate(" +
        state.tx +
        "px," +
        state.ty +
        "px) scale(" +
        state.scale +
        ")";
    }

    function persistView() {
      if (!state.userAdjusted) {
        writePrefs(root, {
          scale: undefined,
          tx: undefined,
          ty: undefined,
        });
        return;
      }
      writePrefs(root, {
        scale: state.scale,
        tx: state.tx,
        ty: state.ty,
      });
    }

    function persistHeight() {
      writePrefs(root, { heightPx: currentHeight() });
    }

    function resetHeight() {
      applyHeight(minHeightFor(root));
      writePrefs(root, { heightPx: undefined });
      state.fitScale = computeFitScale();
      if (!state.userAdjusted) {
        centerFit(state.fitScale, false);
        persistView();
      }
    }

    function centerFit(scale, animate) {
      var contentW = vb.w * scale;
      var contentH = vb.h * scale;
      state.tx = Math.max(
        VIEWPORT_PADDING,
        (surface.clientWidth - contentW) / 2
      );
      state.ty = Math.max(
        VIEWPORT_PADDING,
        (surface.clientHeight - contentH) / 2
      );
      state.scale = scale;
      applyTransform(animate);
    }

    function computeFitScale() {
      if (surface.clientWidth <= 0 || surface.clientHeight <= 0) {
        return state.fitScale;
      }
      var innerW = Math.max(surface.clientWidth - VIEWPORT_PADDING * 2, 1);
      var innerH = Math.max(surface.clientHeight - VIEWPORT_PADDING * 2, 1);
      return Math.min(innerW / vb.w, innerH / vb.h, 1);
    }

    function fitToViewport() {
      state.fitScale = computeFitScale();
      if (!state.userAdjusted) {
        centerFit(state.fitScale, false);
        persistView();
      }
    }

    function restoreView() {
      if (
        typeof saved.scale === "number" &&
        typeof saved.tx === "number" &&
        typeof saved.ty === "number"
      ) {
        state.scale = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, saved.scale)
        );
        state.tx = saved.tx;
        state.ty = saved.ty;
        state.userAdjusted = true;
        applyTransform(false);
        return;
      }
      state.userAdjusted = false;
      fitToViewport();
    }

    function resetView() {
      state.userAdjusted = false;
      applyHeight(minHeightFor(root));
      state.fitScale = computeFitScale();
      centerFit(state.fitScale, true);
      clearPrefs(root);
    }

    function zoomBy(factor) {
      if (surface.clientWidth <= 0) {
        return;
      }
      var next = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, state.scale * factor)
      );
      if (Math.abs(next - state.scale) < 0.0001) {
        return;
      }
      var anchorX = surface.clientWidth / 2;
      var anchorY = surface.clientHeight / 2;
      state.tx = anchorX - ((anchorX - state.tx) * next) / state.scale;
      state.ty = anchorY - ((anchorY - state.ty) * next) / state.scale;
      state.scale = next;
      state.userAdjusted = true;
      applyTransform(true);
      persistView();
    }

    function endPan(event) {
      if (!state.panning) {
        return;
      }
      state.panning = false;
      if (event && surface.hasPointerCapture(event.pointerId)) {
        surface.releasePointerCapture(event.pointerId);
      }
      surface.classList.remove("svg-viewer-surface--dragging");
      document.removeEventListener("pointerup", onDocumentPanEnd);
      document.removeEventListener("pointercancel", onDocumentPanEnd);
      if (state.moved) {
        persistView();
      }
    }

    function onDocumentPanEnd(event) {
      endPan(event);
    }

    function onPanPointerDown(event) {
      if (event.button !== 0 || event.pointerType === "touch") {
        return;
      }
      if (event.target && event.target.closest && event.target.closest("a, button")) {
        return;
      }
      state.panning = true;
      state.moved = false;
      state.startX = event.clientX;
      state.startY = event.clientY;
      state.startTx = state.tx;
      state.startTy = state.ty;
      surface.setPointerCapture(event.pointerId);
      surface.classList.add("svg-viewer-surface--dragging");
      document.addEventListener("pointerup", onDocumentPanEnd);
      document.addEventListener("pointercancel", onDocumentPanEnd);
    }

    function onPanPointerMove(event) {
      if (!state.panning) {
        return;
      }
      if ((event.buttons & 1) === 0) {
        endPan(event);
        return;
      }
      var dx = event.clientX - state.startX;
      var dy = event.clientY - state.startY;
      if (
        !state.moved &&
        (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX)
      ) {
        state.moved = true;
      }
      state.tx = state.startTx + dx;
      state.ty = state.startTy + dy;
      if (state.moved) {
        state.userAdjusted = true;
      }
      applyTransform(false);
    }

    function onPanPointerUp(event) {
      endPan(event);
    }

    function onClickCapture(event) {
      if (!state.moved) {
        return;
      }
      if (event.target && event.target.closest && event.target.closest("a")) {
        event.preventDefault();
        event.stopPropagation();
      }
      state.moved = false;
    }

    function endResize(event) {
      if (!state.resizing) {
        return;
      }
      state.resizing = false;
      if (event && resize && resize.hasPointerCapture(event.pointerId)) {
        resize.releasePointerCapture(event.pointerId);
      }
      document.removeEventListener("pointermove", onResizePointerMove);
      document.removeEventListener("pointerup", onResizePointerEnd);
      document.removeEventListener("pointercancel", onResizePointerEnd);
      persistHeight();
      state.fitScale = computeFitScale();
      if (!state.userAdjusted) {
        centerFit(state.fitScale, false);
        persistView();
      }
    }

    function onResizePointerMove(event) {
      if (!state.resizing) {
        return;
      }
      if ((event.buttons & 1) === 0) {
        endResize(event);
        return;
      }
      var dy = event.clientY - state.resizeStartY;
      applyHeight(clampHeight(root, state.resizeStartHeight + dy));
    }

    function onResizePointerEnd(event) {
      endResize(event);
    }

    function onResizePointerDown(event) {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      state.resizing = true;
      state.resizeStartY = event.clientY;
      state.resizeStartHeight = currentHeight();
      if (resize) {
        resize.setPointerCapture(event.pointerId);
      }
      document.addEventListener("pointermove", onResizePointerMove);
      document.addEventListener("pointerup", onResizePointerEnd);
      document.addEventListener("pointercancel", onResizePointerEnd);
    }

    function onResizeDoubleClick(event) {
      event.preventDefault();
      event.stopPropagation();
      resetHeight();
    }

    function onZoomIn() {
      zoomBy(1 + ZOOM_STEP);
    }
    function onZoomOut() {
      zoomBy(1 - ZOOM_STEP);
    }
    function onZoomReset() {
      resetView();
    }

    if (zoomIn) {
      zoomIn.addEventListener("click", onZoomIn);
    }
    if (zoomOut) {
      zoomOut.addEventListener("click", onZoomOut);
    }
    if (reset) {
      reset.addEventListener("click", onZoomReset);
    }

    if (resize) {
      resize.addEventListener("pointerdown", onResizePointerDown);
      resize.addEventListener("dblclick", onResizeDoubleClick);
    }

    surface.addEventListener("pointerdown", onPanPointerDown);
    surface.addEventListener("pointermove", onPanPointerMove);
    surface.addEventListener("pointerup", onPanPointerUp);
    surface.addEventListener("pointercancel", onPanPointerUp);
    surface.addEventListener("click", onClickCapture, true);

    if (typeof saved.heightPx === "number") {
      applyHeight(clampHeight(root, saved.heightPx));
    } else {
      applyHeight(minHeightFor(root));
    }

    var resizeObserver = null;
    function onWindowResize() {
      fitToViewport();
    }
    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(function () {
        fitToViewport();
      });
      resizeObserver.observe(surface);
    } else {
      window.addEventListener("resize", onWindowResize);
    }

    root._destroy = function () {
      if (zoomIn) {
        zoomIn.removeEventListener("click", onZoomIn);
      }
      if (zoomOut) {
        zoomOut.removeEventListener("click", onZoomOut);
      }
      if (reset) {
        reset.removeEventListener("click", onZoomReset);
      }
      if (resize) {
        resize.removeEventListener("pointerdown", onResizePointerDown);
        resize.removeEventListener("dblclick", onResizeDoubleClick);
      }
      surface.removeEventListener("pointerdown", onPanPointerDown);
      surface.removeEventListener("pointermove", onPanPointerMove);
      surface.removeEventListener("pointerup", onPanPointerUp);
      surface.removeEventListener("pointercancel", onPanPointerUp);
      surface.removeEventListener("click", onClickCapture, true);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", onWindowResize);
      }
      delete root._destroy;
    };

    root.dataset.svgViewerInitialized = "true";
    restoreView();
  }

  function boot() {
    var nodes = document.querySelectorAll(
      ".svg-viewer:not([data-svg-viewer-initialized])"
    );
    for (var i = 0; i < nodes.length; i += 1) {
      initSvgViewer(nodes[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();`;
}
