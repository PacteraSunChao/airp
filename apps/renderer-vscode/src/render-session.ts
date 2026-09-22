import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { AirpDiagnostic } from "@airp/diagnostics";
import { logDiagnostics } from "@airp/diagnostics";
import type { Logger } from "@airp/utils";
import {
  commands,
  type Disposable,
  type ExtensionContext,
  env,
  type OutputChannel,
  RelativePattern,
  Uri,
  ViewColumn,
  type WebviewPanel,
  window,
  workspace,
} from "vscode";
import { colorSchemeFromThemeKind } from "./color-scheme";
import { toDiagnosticLines } from "./diagnostic-lines";
import { isCursorHost } from "./host-env";
import { buildHostShellHtml } from "./host-shell";
import type {
  ExportFormat,
  HostToWebviewMessage,
  WebviewToHostMessage,
} from "./messages";
import { isAirpJsonFsPath, resolveExportDefaultPath } from "./paths";
import { buildTargetOptions } from "./target-options-build";
import {
  DebouncedSerialRunner,
  formatWatchLogLine,
  WATCH_DEBOUNCE_MS,
  WatchEventBuffer,
  type WatchEventKind,
} from "./watch";
import { WorkerSlot } from "./worker-slot";

const RENDER_FAILED = "Render failed";
const RENDER_SUCCEEDED = "Render succeeded";
const SOURCE_DELETED = "AIRP document was deleted";
const EXPORT_FAILED = "Export failed";
const PANEL_TITLE = "AIRP Renderer";
const LAST_EXPORT_DIR_KEY = "airp.renderer.lastExportDir";
const RENDERER_CONFIGURATION_SECTION = "airp.renderer";
const RERENDER_DELAY_SETTING = "rerenderDelay";

export interface RenderSessionHost {
  context: ExtensionContext;
  extensionUri: Uri;
  log: Logger;
  output: OutputChannel;
}

export interface RenderSessionOptions {
  host: RenderSessionHost;
  inputFsPath: string;
  panel: WebviewPanel;
}

/**
 * One render session per absolute `*.airp.json` path.
 * Success paints rendered HTML; first-open failure uses the host error shell.
 */
export class RenderSession {
  private readonly host: RenderSessionHost;
  private readonly panel: WebviewPanel;
  private readonly inputFsPath: string;
  private readonly workerSlot: WorkerSlot;
  private readonly disposables: Disposable[] = [];
  private readonly watchEvents = new WatchEventBuffer();
  private watchRunner: DebouncedSerialRunner | undefined;
  private hasSuccessfulHtml = false;
  private disposed = false;

  constructor(options: RenderSessionOptions) {
    this.host = options.host;
    this.panel = options.panel;
    this.inputFsPath = path.resolve(options.inputFsPath);
    this.workerSlot = new WorkerSlot({
      extensionUri: options.host.extensionUri,
    });
    this.panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [Uri.joinPath(this.host.extensionUri, "dist")],
    };
    this.disposables.push(
      this.panel.webview.onDidReceiveMessage((raw: unknown) => {
        this.onWebviewMessage(raw).catch((error: unknown) => {
          const text = error instanceof Error ? error.message : String(error);
          this.host.log.error(text);
        });
      }),
      this.panel.onDidDispose(() => {
        this.dispose();
      }),
      window.onDidChangeActiveColorTheme((theme) => {
        if (!this.hasSuccessfulHtml || this.disposed) {
          return;
        }
        this.post({
          type: "colorScheme",
          value: colorSchemeFromThemeKind(theme.kind),
        });
      })
    );
  }

  getInputFsPath(): string {
    return this.inputFsPath;
  }

  isActive(): boolean {
    return this.panel.active;
  }

  async start(): Promise<void> {
    this.panel.title = PANEL_TITLE;
    this.startWatching();
    await this.runRender();
  }

  reveal(): void {
    this.panel.reveal(ViewColumn.Active, true);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.stopWatching();
    this.workerSlot.killActive();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;
  }

  private post(message: HostToWebviewMessage): void {
    this.panel.webview.postMessage(message).then(
      () => undefined,
      () => undefined
    );
  }

  private async onWebviewMessage(raw: unknown): Promise<void> {
    if (typeof raw !== "object" || raw === null || !("type" in raw)) {
      return;
    }
    const message = raw as WebviewToHostMessage;
    if (message.type === "openOutput") {
      this.host.output.show(true);
      return;
    }
    if (message.type === "editSource") {
      await commands.executeCommand(
        "airp.renderer.editSource",
        Uri.file(this.inputFsPath)
      );
      return;
    }
    if (message.type === "export") {
      await this.runExport(message.format);
    }
  }

  private async currentTargetOptions(): Promise<
    Awaited<ReturnType<typeof buildTargetOptions>>
  > {
    return await buildTargetOptions({
      colorScheme: colorSchemeFromThemeKind(window.activeColorTheme.kind),
      extensionUri: this.host.extensionUri,
      renderFailed: RENDER_FAILED,
      renderSucceeded: RENDER_SUCCEEDED,
      useCustomFind: isCursorHost(env.appName),
      webview: this.panel.webview,
    });
  }

  private logDiagnostics(diagnostics: readonly AirpDiagnostic[]): void {
    logDiagnostics(this.host.log, [...diagnostics]);
  }

  private async runRender(): Promise<void> {
    const keepPreviousHtml = this.hasSuccessfulHtml;
    const targetOptions = await this.currentTargetOptions();
    const result = await this.workerSlot.runRender({
      input: this.inputFsPath,
      target: "html",
      targetOptions: {
        extraHeadPre: targetOptions.extraHeadPre,
        extraHead: targetOptions.extraHead,
        extraBody: targetOptions.extraBody,
        extraAppHeader: targetOptions.extraAppHeader,
      },
    });
    if (this.disposed) {
      return;
    }
    if (!result.ok) {
      if (result.cancelled) {
        return;
      }
      this.logDiagnostics(result.diagnostics);
      const lines = toDiagnosticLines(result.diagnostics);
      if (keepPreviousHtml) {
        this.post({ type: "toast", kind: "failed" });
        return;
      }
      this.panel.webview.html = await buildHostShellHtml({
        extensionUri: this.host.extensionUri,
        diagnostics: lines,
        renderFailed: RENDER_FAILED,
        renderSucceeded: RENDER_SUCCEEDED,
        useCustomFind: isCursorHost(env.appName),
        webview: this.panel.webview,
      });
      return;
    }
    this.logDiagnostics(result.diagnostics);
    this.hasSuccessfulHtml = true;
    this.panel.title = result.documentTitle;
    this.panel.webview.html = result.body;
  }

  private async runExport(format: ExportFormat): Promise<void> {
    const filters: { [name: string]: string[] } =
      format === "html" ? { HTML: ["html"] } : { Markdown: ["md"] };
    const lastExportDir =
      this.host.context.globalState.get<string>(LAST_EXPORT_DIR_KEY);
    const uri = await window.showSaveDialog({
      defaultUri: Uri.file(
        resolveExportDefaultPath(this.inputFsPath, format, lastExportDir)
      ),
      filters,
    });
    if (!uri) {
      return;
    }
    const result = await this.workerSlot.runRender({
      input: this.inputFsPath,
      target: format === "html" ? "html" : "markdown",
    });
    if (!result.ok) {
      if (result.cancelled) {
        return;
      }
      this.logDiagnostics(result.diagnostics);
      this.host.log.error(EXPORT_FAILED);
      this.post({ type: "toast", kind: "failed" });
      return;
    }
    this.logDiagnostics(result.diagnostics);
    await writeFile(uri.fsPath, result.body, "utf8");
    await this.host.context.globalState.update(
      LAST_EXPORT_DIR_KEY,
      path.dirname(uri.fsPath)
    );
    this.host.log.info(`Exported ${uri.fsPath}`);
    this.post({ type: "toast", kind: "succeeded" });
  }

  private startWatching(): void {
    if (this.watchRunner) {
      return;
    }
    this.watchRunner = new DebouncedSerialRunner(() => this.onWatchFire());
    const dir = path.dirname(this.inputFsPath);
    const base = path.basename(this.inputFsPath);
    const fileWatcher = workspace.createFileSystemWatcher(
      new RelativePattern(dir, base)
    );
    this.disposables.push(
      fileWatcher,
      fileWatcher.onDidChange((uri) => {
        this.handleWatchEvent(uri, "change");
      }),
      fileWatcher.onDidCreate((uri) => {
        this.handleWatchEvent(uri, "create");
      }),
      fileWatcher.onDidDelete((uri) => {
        this.handleWatchEvent(uri, "delete");
      }),
      workspace.onDidSaveTextDocument((doc) => {
        if (path.resolve(doc.uri.fsPath) === this.inputFsPath) {
          this.handleWatchEvent(doc.uri, "save");
        }
      })
    );
  }

  private stopWatching(): void {
    this.watchRunner?.clear();
    this.watchRunner = undefined;
    this.watchEvents.clear();
  }

  private handleWatchEvent(
    uri: { scheme: string; fsPath: string },
    kind: WatchEventKind
  ): void {
    if (!this.watchRunner || uri.scheme !== "file") {
      return;
    }
    const absolute = path.resolve(uri.fsPath);
    if (absolute !== this.inputFsPath) {
      return;
    }
    if (kind === "delete") {
      this.host.log.error(SOURCE_DELETED);
      window.showErrorMessage(SOURCE_DELETED).then(
        () => undefined,
        () => undefined
      );
      this.stopWatching();
      return;
    }
    this.watchEvents.note(absolute, kind);
    this.workerSlot.killActive();
    const rerenderDelayMs = workspace
      .getConfiguration(
        RENDERER_CONFIGURATION_SECTION,
        Uri.file(this.inputFsPath)
      )
      .get<number>(RERENDER_DELAY_SETTING, WATCH_DEBOUNCE_MS);
    this.watchRunner.kick(rerenderDelayMs);
  }

  private async onWatchFire(): Promise<void> {
    const entries = this.watchEvents.drain();
    if (entries.length > 0) {
      this.host.log.info(formatWatchLogLine(entries));
    }
    await this.runRender();
  }
}

export function isRenderableUri(uri: {
  scheme: string;
  fsPath: string;
}): boolean {
  return uri.scheme === "file" && isAirpJsonFsPath(uri.fsPath);
}
