export function resolveHtmlTargetDistDir(): string;

export function htmlTargetDistFiles(distDir?: string): [string, string];

export function waitForHtmlTargetDist(options?: {
  files?: readonly string[];
  pollMs?: number;
  timeoutMs?: number;
}): Promise<void>;

export function waitHtmlDistPlugin(): {
  name: string;
  setup: (build: {
    onResolve: (
      options: { filter: RegExp },
      callback: () => Promise<void>
    ) => void;
    onStart: (callback: () => Promise<void>) => void;
  }) => void;
};
