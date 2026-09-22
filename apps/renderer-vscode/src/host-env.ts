/** True when the extension host is Cursor (broken native webview Find). */
export function isCursorHost(appName: string): boolean {
  return appName.toLowerCase().includes("cursor");
}
