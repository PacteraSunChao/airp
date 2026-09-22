export interface CodeCopyIcons {
  check: string;
  copy: string;
}

export function buildCodeCopyScript(options: {
  copiedLabel: string;
  icons: CodeCopyIcons;
  label: string;
}): string {
  const labelJson = JSON.stringify(options.label);
  const copiedJson = JSON.stringify(options.copiedLabel);
  const copyIconJson = JSON.stringify(options.icons.copy);
  const checkIconJson = JSON.stringify(options.icons.check);

  return `(function () {
  var LABEL = ${labelJson};
  var COPIED = ${copiedJson};
  var COPY_ICON = ${copyIconJson};
  var CHECK_ICON = ${checkIconJson};
  var RESET_MS = 3000;

  // Prefer pre/shiki code; bare "code" would match the filename <code> in chrome.
  function codeText(root) {
    var code = root.querySelector("pre code, .shiki code");
    return code ? (code.innerText || code.textContent || "") : "";
  }

  function writeClipboard(text) {
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      return navigator.clipboard.writeText(text).catch(function () {
        return fallbackCopy(text);
      });
    }
    return fallbackCopy(text);
  }

  function fallbackCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) resolve();
        else reject(new Error("copy failed"));
      } catch (err) {
        document.body.removeChild(ta);
        reject(err);
      }
    });
  }

  function setCopied(button, copied) {
    if (copied) {
      button.setAttribute("data-copied", "");
      button.setAttribute("aria-label", COPIED);
      button.innerHTML = CHECK_ICON;
    } else {
      button.removeAttribute("data-copied");
      button.setAttribute("aria-label", LABEL);
      button.innerHTML = COPY_ICON;
    }
  }

  function initCopyButton(button) {
    if (button.dataset.codeCopyInitialized === "true") return;
    var root =
      button.closest("[data-code-block]") ||
      button.closest("[data-block-type]");
    if (!root) return;

    setCopied(button, false);
    var timer = null;
    button.addEventListener("click", function () {
      var text = codeText(root);
      writeClipboard(text).then(
        function () {
          setCopied(button, true);
          if (timer) window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            setCopied(button, false);
            timer = null;
          }, RESET_MS);
        },
        function () {}
      );
    });
    button.dataset.codeCopyInitialized = "true";
  }

  function boot() {
    var nodes = document.querySelectorAll(
      ".airp-code-copy:not([data-code-copy-initialized])"
    );
    for (var i = 0; i < nodes.length; i += 1) {
      initCopyButton(nodes[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();`;
}
