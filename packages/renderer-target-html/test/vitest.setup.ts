import { vi } from "vitest";
import { loadInlineHtmlStyles } from "./helpers/load-inline-html-styles.js";

vi.mock("../src/styles/input.css?inline", async () => ({
  default: await loadInlineHtmlStyles(),
}));
