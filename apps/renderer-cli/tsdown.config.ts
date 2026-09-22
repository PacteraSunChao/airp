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
    neverBundle: [],
  },
});
