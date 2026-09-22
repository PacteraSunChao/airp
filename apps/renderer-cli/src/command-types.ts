import type { RenderTarget } from "@airp/renderer";

export interface WatchServeConfig {
  enabled: boolean;
  liveReload: boolean;
  port: number;
}

export type RendererCliScene = "export" | "watch";

export interface CommonRenderOptions {
  input: string;
  target: RenderTarget;
}
