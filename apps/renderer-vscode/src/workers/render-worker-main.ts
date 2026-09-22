import type {
  HostToRenderWorkerMessage,
  RenderWorkerToHostMessage,
} from "./ipc";
import { runRenderJob } from "./run-render-job";

function send(message: RenderWorkerToHostMessage): void {
  if (typeof process.send === "function") {
    process.send(message);
  }
}

async function handleRun(message: HostToRenderWorkerMessage): Promise<void> {
  const { recipe } = message;
  try {
    const result = await runRenderJob(recipe, {
      onStage: (stage) => {
        send({ type: "stage", stage, jobId: recipe.jobId });
      },
    });
    if (!result.ok) {
      send({
        type: "result",
        jobId: recipe.jobId,
        ok: false,
        diagnostics: result.diagnostics,
      });
      return;
    }
    send({
      type: "result",
      jobId: recipe.jobId,
      ok: true,
      body: result.value.body,
      documentTitle: result.value.documentTitle,
      diagnostics: result.diagnostics,
    });
  } catch (error: unknown) {
    const messageText = error instanceof Error ? error.message : String(error);
    send({
      type: "result",
      jobId: recipe.jobId,
      ok: false,
      diagnostics: [
        {
          code: "internal",
          severity: "error",
          message: messageText,
        },
      ],
    });
  }
}

process.on("message", (raw: unknown) => {
  if (
    typeof raw === "object" &&
    raw !== null &&
    "type" in raw &&
    (raw as { type: unknown }).type === "run"
  ) {
    handleRun(raw as HostToRenderWorkerMessage).catch((error: unknown) => {
      const messageText =
        error instanceof Error ? error.message : String(error);
      send({
        type: "result",
        jobId: 0,
        ok: false,
        diagnostics: [
          {
            code: "internal",
            severity: "error",
            message: messageText,
          },
        ],
      });
    });
  }
});
