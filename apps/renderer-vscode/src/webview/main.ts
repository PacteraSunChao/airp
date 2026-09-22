import type { HostToWebviewMessage } from "../messages";
import { mountReaderBridge } from "./reader-bridge";

const handle = mountReaderBridge();

window.addEventListener("message", (event) => {
  const data = event.data;
  if (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    typeof (data as { type: unknown }).type === "string"
  ) {
    handle.receive(data as HostToWebviewMessage);
  }
});
