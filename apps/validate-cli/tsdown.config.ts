import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  outDir: "dist",
  clean: true,
  dts: false,
  sourcemap: false,
  minify: false,
  deps: {
    // Bundle workspace packages; keep runtime npm deps external so jsdom/mermaid
    // retain on-disk assets and Ajv subpath imports stay Node-resolvable.
    neverBundle: ["jsdom", "mermaid", "citty"],
    alwaysBundle: [/^@airp\//],
    onlyBundle: false,
  },
});
