import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const PACKAGE_NAME = "airp-renderer-cli";

/** Dev-mode staging lives under `{repoCwd}/.tmp/airp-renderer-cli`. */
const WORKSPACE_STAGING_SEGMENTS = [".tmp", PACKAGE_NAME] as const;

export function isRendererCliDevMode(): boolean {
  return process.env.AIRP_RENDER_CLI_DEV === "1";
}

/** Root directory that holds per-run staging folders. */
export function resolveStagingRoot(repoCwd: string = process.cwd()): string {
  if (isRendererCliDevMode()) {
    return path.join(repoCwd, ...WORKSPACE_STAGING_SEGMENTS);
  }
  return path.join(os.tmpdir(), PACKAGE_NAME);
}

export function createRunId(
  pid: number = process.pid,
  startMs: number = Date.now()
): string {
  return `${pid}-${startMs}`;
}

export function resolveRunStagingDir(
  stagingRoot: string,
  runId: string
): string {
  return path.join(stagingRoot, runId);
}

export async function ensureRunStagingDir(
  runStagingDir: string
): Promise<string> {
  await mkdir(runStagingDir, { recursive: true });
  return runStagingDir;
}

export interface StagingSession {
  runId: string;
  runStagingDir: string;
  stagingRoot: string;
}

export async function createStagingSession(
  repoCwd: string = process.cwd()
): Promise<StagingSession> {
  const stagingRoot = resolveStagingRoot(repoCwd);
  const runId = createRunId();
  const runStagingDir = resolveRunStagingDir(stagingRoot, runId);
  await ensureRunStagingDir(runStagingDir);
  return { stagingRoot, runId, runStagingDir };
}
