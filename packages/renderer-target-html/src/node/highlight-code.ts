import { createHighlighter, type Highlighter } from "shiki";

/** First-wave language whitelist (reader-side; protocol language stays free-form). */
export const SHIKI_LANGUAGE_WHITELIST = [
  "text",
  "diff",
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "html",
  "css",
  "scss",
  "json",
  "jsonc",
  "go",
  "rust",
  "c",
  "cpp",
  "csharp",
  "java",
  "kotlin",
  "python",
  "ruby",
  "php",
  "lua",
  "shellscript",
  "powershell",
  "yaml",
  "toml",
  "xml",
  "graphql",
  "sql",
  "protobuf",
  "markdown",
  "mdx",
  "vue",
  "svelte",
  "dockerfile",
  "terraform",
  "nginx",
  "makefile",
  "swift",
  "scala",
  "dart",
  "ini",
] as const;

export type ShikiLanguage = (typeof SHIKI_LANGUAGE_WHITELIST)[number];

const LANGUAGE_ALIASES: Record<string, ShikiLanguage> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  cts: "typescript",
  mts: "typescript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  sh: "shellscript",
  bash: "shellscript",
  zsh: "shellscript",
  shell: "shellscript",
  yml: "yaml",
  md: "markdown",
  plaintext: "text",
  plain: "text",
  txt: "text",
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  ps1: "powershell",
  dockerfile: "dockerfile",
  docker: "dockerfile",
  tf: "terraform",
  hcl: "terraform",
  make: "makefile",
  mk: "makefile",
};

const WHITELIST_SET = new Set<string>(SHIKI_LANGUAGE_WHITELIST);

let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ["one-light", "one-dark-pro"],
    langs: [...SHIKI_LANGUAGE_WHITELIST],
  });
  return highlighterPromise;
}

/** Normalize protocol language strings onto the whitelist; unknown → text. */
export function resolveShikiLanguage(
  language: string | undefined
): ShikiLanguage {
  if (!language || language.trim().length === 0) {
    return "text";
  }
  const key = language.trim().toLowerCase();
  const aliased = LANGUAGE_ALIASES[key];
  if (aliased) {
    return aliased;
  }
  if (WHITELIST_SET.has(key)) {
    return key as ShikiLanguage;
  }
  return "text";
}

function decorateDiffLines(html: string): string {
  return html.replace(
    /<span class="line">([\s\S]*?)<\/span>/g,
    (full, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, "");
      if (text.startsWith("+")) {
        return `<span class="line airp-diff-add">${inner}</span>`;
      }
      if (text.startsWith("-")) {
        return `<span class="line airp-diff-del">${inner}</span>`;
      }
      return full;
    }
  );
}

export interface HighlightCodeOptions {
  code: string;
  /** When true, tint +/- lines after Shiki. */
  diff?: boolean;
  language?: string;
}

/**
 * Highlight code with Shiki SSR (dual theme CSS variables for html.dark).
 * Failures and unknown languages degrade to plain text highlighting.
 */
export async function highlightCodeHtml(
  options: HighlightCodeOptions
): Promise<string> {
  const lang = resolveShikiLanguage(options.language);
  try {
    const highlighter = await getHighlighter();
    const html = highlighter.codeToHtml(options.code, {
      lang,
      themes: {
        light: "one-light",
        dark: "one-dark-pro",
      },
    });
    return options.diff ? decorateDiffLines(html) : html;
  } catch {
    try {
      const highlighter = await getHighlighter();
      const html = highlighter.codeToHtml(options.code, {
        lang: "text",
        themes: {
          light: "one-light",
          dark: "one-dark-pro",
        },
      });
      return options.diff ? decorateDiffLines(html) : html;
    } catch {
      return "";
    }
  }
}
