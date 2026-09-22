import tailwindcss from "@tailwindcss/postcss";
import cssnano from "cssnano";
import postcssImport from "postcss-import";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/node/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: false,
  deps: {
    neverBundle: [
      "@airp/protocol",
      "@airp/utils",
      "@airp/diagnostics",
      "@airp/renderer-contract",
      "@airp/renderer-shared",
      "jsdom",
      "mermaid",
      "shiki",
    ],
  },
  css: {
    transformer: "postcss",
    minify: true,
    postcss: {
      plugins: [postcssImport(), tailwindcss(), cssnano()],
    },
  },
});
