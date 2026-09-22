import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pkg = JSON.parse(
  readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "../package.json"),
    "utf8"
  )
) as {
  activationEvents: string[];
  contributes: {
    commands: { command: string; title: string }[];
    configuration: {
      properties: Record<
        string,
        {
          default: number;
          description?: string;
          minimum: number;
          scope: string;
          type: string;
        }
      >;
      title: string;
    };
    customEditors: {
      displayName: string;
      priority: string;
      selector: { filenamePattern: string }[];
      viewType: string;
    }[];
    menus: Record<string, { command: string; when: string }[]>;
  };
  main: string;
  name: string;
  publisher: string;
  scripts: Record<string, string>;
};

describe("package contributes", () => {
  it("uses an unscoped marketplace package name", () => {
    expect(pkg.name).toBe("airp-renderer-vscode");
    expect(pkg.publisher).toBe("airp");
    expect(pkg.scripts.package).toContain("vsce package");
    expect(pkg.scripts.package).toContain("--no-dependencies");
  });

  it("activates on workspace *.airp.json and registers Renderer commands", () => {
    expect(pkg.activationEvents).toContain("workspaceContains:**/*.airp.json");
    expect(pkg.main).toBe("./dist/extension.cjs");
    expect(pkg.contributes.commands.map((c) => c.command)).toEqual(
      expect.arrayContaining(["airp.renderer.open", "airp.renderer.editSource"])
    );
    expect(pkg.contributes.commands.map((c) => c.title)).toEqual(
      expect.arrayContaining(["Open Renderer", "Edit Source"])
    );
    expect(pkg.contributes.customEditors).toEqual([
      {
        viewType: "airp.renderer",
        displayName: "AIRP Renderer",
        selector: [{ filenamePattern: "*.airp.json" }],
        priority: "default",
      },
    ]);
    expect(pkg.contributes.menus["editor/title"]).toBeUndefined();
    for (const menu of ["editor/context", "explorer/context"] as const) {
      const entries = pkg.contributes.menus[menu] ?? [];
      expect(entries.some((e) => e.command === "airp.renderer.open")).toBe(
        true
      );
      expect(entries.some((e) => e.when.includes("\\.airp\\.json"))).toBe(true);
    }
  });

  it("contributes a resource-scoped rerender delay setting", () => {
    expect(pkg.contributes.configuration.title).toBe("AIRP Renderer");
    expect(
      pkg.contributes.configuration.properties["airp.renderer.rerenderDelay"]
    ).toMatchObject({
      default: 1000,
      minimum: 0,
      scope: "resource",
      type: "integer",
    });
    expect(
      pkg.contributes.configuration.properties["airp.renderer.rerenderDelay"]
        .description
    ).toBe(
      "Delay in milliseconds after an AIRP document changes before it is rendered again."
    );
    expect(
      pkg.contributes.configuration.properties["airp.renderer.colorScheme"]
    ).toBeUndefined();
  });

  it("root package.json keeps renderer-vscode:sample watch script", () => {
    const rootPackageJson = JSON.parse(
      readFileSync(
        path.join(
          path.dirname(fileURLToPath(import.meta.url)),
          "../../../package.json"
        ),
        "utf8"
      )
    ) as { scripts: Record<string, string> };
    const sample = rootPackageJson.scripts["renderer-vscode:sample"];
    expect(sample).toContain("--filter airp-renderer-vscode");
    expect(sample).toContain("esbuild.mjs --watch");
  });
});
