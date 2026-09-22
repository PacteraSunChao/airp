export function stubXhrSyncWorkerPlugin(): {
  name: string;
  setup: (build: {
    onLoad: (
      options: { filter: RegExp },
      callback: (args: { path: string }) => Promise<{
        contents: string;
        loader: string;
      }>
    ) => void;
  }) => void;
};
