import {
  AIRP_EVENTS_PATH,
  AIRP_RENDER_ERROR_EVENT,
} from "./watch-serve-server.js";

export const LIVE_RELOAD_ATTR = "data-airp-live-reload";
export const ERROR_BANNER_ATTR = "data-airp-error-banner";

const LIVE_RELOAD_SCRIPT = `<script ${LIVE_RELOAD_ATTR}>(function(){var bannerId="airp-watch-error";function showError(msg){var el=document.getElementById(bannerId);if(!el){el=document.createElement("div");el.id=bannerId;el.setAttribute("${ERROR_BANNER_ATTR}","");el.style.cssText="position:fixed;top:0;left:0;right:0;padding:8px 12px;background:#b91c1c;color:#fff;font:14px/1.4 system-ui,sans-serif;z-index:2147483647;";document.body.appendChild(el);}el.textContent=msg;el.hidden=false;}function hideError(){var el=document.getElementById(bannerId);if(el){el.hidden=true;}}window.addEventListener("pageshow",function(e){if(e.persisted){location.reload();}});function connect(){var es=new EventSource("${AIRP_EVENTS_PATH}");es.addEventListener("reload",function(){hideError();location.reload();});es.addEventListener("${AIRP_RENDER_ERROR_EVENT}",function(e){var msg=e.data;try{msg=JSON.parse(e.data).message;}catch(_){}showError(msg||"Render failed");});es.onerror=function(){es.close();setTimeout(connect,1000);};}connect();})();</script>`;

/** Inject dev-only SSE live reload into watch HTML (never written to staging/--out). */
export function injectLiveReloadScript(html: string): string {
  if (html.includes(LIVE_RELOAD_ATTR)) {
    return html;
  }
  return html.replace("</body>", `${LIVE_RELOAD_SCRIPT}</body>`);
}

export function hasLiveReloadScript(html: string): boolean {
  return html.includes(LIVE_RELOAD_ATTR);
}
