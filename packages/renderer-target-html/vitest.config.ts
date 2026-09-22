import { defineConfig } from "vitest/config";
import { vitestConfig } from "../../vitest.shared";

export default defineConfig({
  test: {
    ...vitestConfig("airp-renderer-target-html"),
    setupFiles: ["./test/vitest.setup.ts"],
  },
});
