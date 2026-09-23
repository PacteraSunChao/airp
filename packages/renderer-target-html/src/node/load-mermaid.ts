import type Mermaid from "mermaid";
import { ensureMermaidDom } from "./ensure-mermaid-dom.js";

let mermaidApi: typeof Mermaid | undefined;

/** Load Mermaid after DOM shim. */
export async function loadMermaid(): Promise<typeof Mermaid> {
  ensureMermaidDom();
  if (!mermaidApi) {
    const mod = await import("mermaid");
    const api = mod.default;
    api.initialize({ startOnLoad: false, securityLevel: "strict" });
    mermaidApi = api;
  }
  return mermaidApi;
}
