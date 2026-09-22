import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";
import postcssImport from "postcss-import";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

let cachedStyles: string | undefined;

export async function loadInlineHtmlStyles(): Promise<string> {
  if (cachedStyles) {
    return cachedStyles;
  }

  const inputPath = path.join(packageRoot, "src/styles/input.css");
  const source = readFileSync(inputPath, "utf8");
  const result = await postcss([postcssImport(), tailwindcss()]).process(
    source,
    {
      from: inputPath,
    }
  );
  cachedStyles = result.css;
  return cachedStyles;
}
