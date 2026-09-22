import type { AirpDiagnostic } from "@airp/diagnostics";
import type { RenderTarget } from "@airp/renderer";

export type PipelineStage = "loading" | "validating" | "rendering";

/** Serializable recipe from host → render-worker. */
export interface RenderJobRecipe {
  input: string;
  jobId: number;
  target: RenderTarget;
  targetOptions?: Readonly<Record<string, unknown>>;
}

export interface HostToRenderWorkerMessage {
  recipe: RenderJobRecipe;
  type: "run";
}

export type RenderWorkerToHostMessage =
  | { type: "stage"; stage: PipelineStage; jobId: number }
  | {
      type: "result";
      jobId: number;
      ok: true;
      body: string;
      documentTitle: string;
      diagnostics: AirpDiagnostic[];
    }
  | {
      type: "result";
      jobId: number;
      ok: false;
      cancelled?: boolean;
      diagnostics: AirpDiagnostic[];
    };
