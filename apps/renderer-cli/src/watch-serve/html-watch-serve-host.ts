import { injectLiveReloadScript } from "./live-reload.js";
import {
  createWatchServeServer,
  type WatchServeServer,
} from "./watch-serve-server.js";

export interface HtmlWatchServeHostOptions {
  onError: (message: string) => void;
  port: number;
}

/** Supervisor-owned watch HTTP serve: memory HTML + live reload. */
export class HtmlWatchServeHost {
  private cache: string | null = null;
  private lastError: string | null = null;
  private readonly options: HtmlWatchServeHostOptions;
  private server: WatchServeServer | undefined;

  constructor(options: HtmlWatchServeHostOptions) {
    this.options = options;
  }

  async start(): Promise<string> {
    this.server = await createWatchServeServer({
      getHtml: async () => this.getServeBody(),
      port: this.options.port,
    });
    return this.server.url;
  }

  /** Load pure primary HTML into memory (inject live-reload here only). */
  setStagingHtml(html: string): void {
    this.cache = injectLiveReloadScript(html);
    this.lastError = null;
    this.server?.notifyReload();
  }

  reportRenderError(message: string): void {
    this.lastError = message;
    this.options.onError(message);
    this.server?.notifyRenderError(message);
  }

  async close(): Promise<void> {
    await this.server?.close();
    this.server = undefined;
  }

  private getServeBody(): Promise<string | null> {
    if (this.lastError && !this.cache) {
      return Promise.reject(new Error(this.lastError));
    }
    if (this.lastError && this.cache) {
      return Promise.resolve(this.cache);
    }
    if (this.cache) {
      return Promise.resolve(this.cache);
    }
    return Promise.resolve(null);
  }
}
