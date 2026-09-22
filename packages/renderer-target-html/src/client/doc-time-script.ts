/** Client: format [data-doc-time] in the reader's local timezone. */
export function buildDocTimeScript(): string {
  return `(function () {
  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatOffset(minutes) {
    var sign = minutes <= 0 ? "+" : "-";
    var abs = Math.abs(minutes);
    var h = Math.floor(abs / 60);
    var m = abs % 60;
    return "(UTC" + sign + h + (m ? ":" + pad(m) : "") + ")";
  }

  function formatLocal(date) {
    var offset = formatOffset(date.getTimezoneOffset());
    return (
      offset +
      " " +
      date.getFullYear() +
      "/" +
      pad(date.getMonth() + 1) +
      "/" +
      pad(date.getDate()) +
      " " +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes())
    );
  }

  function hydrate(root) {
    var nodes = root.querySelectorAll("time[data-doc-time]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var iso = el.getAttribute("datetime");
      if (!iso) continue;
      var date = new Date(iso);
      if (Number.isNaN(date.getTime())) continue;
      var label = el.getAttribute("data-doc-time-label") || "";
      var sep = el.getAttribute("data-doc-time-sep") || ": ";
      var by = el.getAttribute("data-doc-time-by") || "";
      var byPrefix = by ? by + " " : "";
      var textNode = el.querySelector("[data-doc-time-text]");
      if (textNode) {
        textNode.textContent = label + sep + byPrefix + formatLocal(date);
      } else {
        el.textContent = label + sep + byPrefix + formatLocal(date);
      }
    }
  }

  function boot() {
    hydrate(document);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();`;
}
