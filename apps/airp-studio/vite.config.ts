import { defineConfig } from "vite";
import { renderServicePlugin } from "./vite-plugin-render-service.js";

export default defineConfig({
  // The canvas is rendered by the AIRP Renderer itself, through this endpoint:
  // see `render-service.ts` for why that has to be the Node pipeline.
  plugins: [renderServicePlugin()],
  build: { outDir: "dist" },
});
