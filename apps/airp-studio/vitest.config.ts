import { defineConfig } from "vitest/config";
import { vitestConfig } from "../../vitest.shared";

export default defineConfig({
  test: {
    ...vitestConfig("airp-studio"),
    // The browser case drives a real Vite server and Chromium.
    testTimeout: 60_000,
  },
});
