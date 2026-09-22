import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";

export const AIRP_EVENTS_PATH = "/__airp/events";
export const WATCH_PAGE_PATH = "/document.html";
export const AIRP_RENDER_ERROR_EVENT = "render-error";

export interface WatchServeServer {
  close(): Promise<void>;
  notifyReload(): void;
  notifyRenderError(message: string): void;
  url: string;
}

export interface WatchServeServerOptions {
  getHtml: () => Promise<string | null>;
  port: number;
}

function pushSseEvent(
  clients: Set<ServerResponse>,
  event: string,
  data: string
): void {
  const payload = `event: ${event}\ndata: ${data}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}

async function handleHtml(
  res: ServerResponse,
  getHtml: () => Promise<string | null>
): Promise<void> {
  try {
    const body = await getHtml();
    if (body === null) {
      res.writeHead(503, {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      });
      res.end("No rendered HTML available");
      return;
    }
    res.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500, {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    });
    res.end((error as Error).message);
  }
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  options: WatchServeServerOptions,
  clients: Set<ServerResponse>
): Promise<void> {
  const requestUrl = new URL(
    req.url ?? "/",
    `http://127.0.0.1:${options.port}`
  );
  const { pathname } = requestUrl;

  if (pathname === AIRP_EVENTS_PATH) {
    res.writeHead(200, {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no",
    });
    res.write(": connected\n\n");
    clients.add(res);
    req.on("close", () => {
      clients.delete(res);
    });
    return;
  }

  if (pathname === "/" || pathname === WATCH_PAGE_PATH) {
    await handleHtml(res, options.getHtml);
    return;
  }

  res.writeHead(404, {
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
  });
  res.end("Not Found");
}

export function createWatchServeServer(
  options: WatchServeServerOptions
): Promise<WatchServeServer> {
  const clients = new Set<ServerResponse>();

  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      handleRequest(req, res, options, clients).catch(() => {
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        }
        res.end("Internal Server Error");
      });
    });

    server.on("error", reject);
    server.listen(options.port, "127.0.0.1", () => {
      const address = server.address();
      const actualPort =
        typeof address === "object" && address ? address.port : options.port;
      resolve({
        url: `http://127.0.0.1:${actualPort}${WATCH_PAGE_PATH}`,
        notifyReload() {
          pushSseEvent(clients, "reload", "reload");
        },
        notifyRenderError(message) {
          pushSseEvent(
            clients,
            AIRP_RENDER_ERROR_EVENT,
            JSON.stringify({ message })
          );
        },
        close: () =>
          new Promise<void>((closeResolve, closeReject) => {
            for (const client of clients) {
              client.end();
            }
            clients.clear();
            server.close((error) => {
              if (error) {
                closeReject(error);
              } else {
                closeResolve();
              }
            });
          }),
      });
    });
  });
}
