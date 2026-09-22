# 项目技术栈规范（SSOT）

本文档是 **AIRP** 技术栈与工具链的单一事实来源（SSOT），供代理与协作者快速对齐环境；实现细节以仓库内 `package.json`、`AGENTS.md` 与各 Skill 为准。

包职责、依赖方向与数据流见 `registry://rules.package-boundaries`。

## 范围（Scope）

- **覆盖**：包管理器、运行时版本、核心依赖、质量与测试工具、常用 `pnpm` 脚本摘要。
- **不覆盖**：包职责细则、依赖 DAG、数据流、符号准入（见 `registry://rules.package-boundaries`）；各 Skill 内的生成流程。

## 包管理与运行

- **包管理器**：`pnpm`（workspace monorepo）
  - **锁定版本**：`packageManager: pnpm@10.24.0`（见根 `package.json`）
  - **最低版本**：`engines.pnpm: >=10.17`
- **Node**：`>=20.19`（见根 `package.json` `engines`）
- **Workspace 范围**：`pnpm-workspace.yaml` 登记 `packages/*`、`apps/*`
- **构建编排**：`turbo`（`^2.8.0`）
- **根包模块类型**：`"type": "module"`（根 `package.json`）
- **npm scope**：`@airp/*`

## 语言与工具

版本以根及各包 `package.json` 为准；下列为当前仓库锁定/声明值（变更依赖时请同步本文档）：

- **TypeScript**：`^6.0.3`（根 `devDependencies` 统一声明；`.npmrc` hoist `typescript` / `@types/*` 供各包 `tsc` 使用）
- **Node 类型**：`@types/node` `^20.19.39`（根声明；`base.json` 设 `types: ["node"]`）
- **共享 TS 配置**：`@airp/typescript-config`（workspace，`packages/typescript-config/`）
- **校验**：`ajv`（protocol / validate 阶段接线）
- **图语法**：`mermaid`（validate/node 的 `parse` 与 renderer-target-html/node 的 SVG 导出同版本锁定）
- **行级差分**：`diff`（jsdiff；`renderer-target-html` 的 `codeDiff` before/after split）
- **HTML 阅读器构建**：`tsdown` + `@tsdown/css`；`tailwindcss` / `@tailwindcss/postcss` `^4.3.2`；`postcss` / `postcss-import` / `cssnano`；图标 `lucide-static`（构建期 codegen）；**无** Basecoat / `basecoat-css`
- **VS Code 扩展**：`apps/renderer-vscode` 用 `esbuild` 多入口（extension / render-worker / webview）；`engines.vscode: ^1.90`
- **样例双 watch**：根 `pnpm renderer-cli:sample`（HTML `tsdown --watch` + CLI serve）；`pnpm renderer-vscode:sample`（HTML `tsdown --watch` + 扩展 `esbuild --watch`）
- **测试**：`vitest`（`4.1.11`）
- **Lint / format**：`ultracite@7.4.2`、`@biomejs/biome@2.4.8`；根 `biome.jsonc` extends `ultracite/core`；各 workspace 包 `check` / `fix` 通过 `pnpm dlx ultracite@7.4.2` 调用（与根 `devDependencies.ultracite` 对齐）

## 质量与测试

- **类型检查**：各包 `pnpm typecheck`（`tsc --noEmit`）
- **Lint / format**：各包 `pnpm check` / `pnpm fix`；根目录通过 `turbo run` 聚合
- **单元测试**：各包 `pnpm test`（vitest）

## 常用脚本（摘要）

| 脚本 | 用途 |
|------|------|
| `pnpm test` | 全 monorepo 测试（turbo） |
| `pnpm check` | agents registry + testing surface + runtime entries + 全 monorepo 类型检查 + ultracite check |
| `pnpm fix` | 同上前置门禁 + 全 monorepo 类型检查 + ultracite fix |
| `pnpm check-agents-registry` | 校验 `AGENTS.md` / `.agents` registry 一致性 |
| `pnpm check-testing-surface` | 校验各包 `test/surface.json` 结构登记 |
| `pnpm check-runtime-entries` | 同构入口禁止 `node:` / `@airp/*/node` |
| `pnpm list-testing-surface` | 列出各包 Tier / case 登记 |
| `pnpm renderer-cli:sample` | `rm -rf` HTML `dist` 后双 watch；CLI dev 等待 dist 再渲（`block-gallery`；locale 取自文档） |
| `pnpm renderer-vscode:sample` | `rm -rf` HTML `dist` 后双 watch；扩展 `esbuild --watch`（`wait-html-dist` 等 dist；配合 F5 / Launch AIRP Renderer） |
| `pnpm --filter <pkg> fix` | 仅对指定 workspace 包执行 fix |
