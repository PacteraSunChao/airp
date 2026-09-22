import { access } from "node:fs/promises";

/** True when `access` succeeds for the path. */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
