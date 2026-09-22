# 变更后的 `pnpm fix`

## 何时必须执行

在**交付前**（提交、PR、宣称任务完成之前），若本次工作区变更触及下面「受约束源码」中的**任一**文件（新增或修改内容），则必须执行 `pnpm fix`（并对齐 [../checklists/post-change-fix.md](../checklists/post-change-fix.md)）：

### 受约束源码（固定清单）

- TypeScript / JavaScript：`*.ts`、`*.tsx`、`*.mts`、`*.cts`、`*.js`、`*.jsx`、`*.mjs`、`*.cjs`

### 可跳过 `pnpm fix` 的常见例外

- **仅**修改纯文档或不进质量管道的文件（例如普通 `*.md`、图片、与脚本无关的纯文本），且未触碰「受约束源码」。
- **仅**修改 `.agents/` 下说明性内容且未触碰应用/库「受约束源码」。

若本次变更**不包含**上述扩展名文件：可跳过 `pnpm fix`（除非其它专项 Skill 或任务要求明确要求执行）。

## `pnpm fix` / `pnpm check` 在本仓库中的含义

以各 workspace 包 `package.json` 的 `scripts.check` / `scripts.fix` 为准，通常依次执行：

1. `pnpm typecheck`（`tsc --noEmit`）
2. `pnpm dlx ultracite@<版本> check|fix`（版本从根 `package.json` 的 `devDependencies.ultracite` 读取）

根目录 `pnpm check` / `pnpm fix` 通过 `turbo run` 聚合各包任务。

## 路径收窄（推荐）

对本次变更涉及的 workspace 包收窄，避免不必要的全量检查：

```bash
pnpm --filter @airp/validate fix
pnpm --filter @airp/validate-cli fix
```

或在包目录内：

```bash
cd packages/validate && pnpm fix
```

多个包可重复 `--filter`，或交付前在根目录执行一次全量 `pnpm fix` / `pnpm check`。

## 失败时怎么处理

- 先阅读终端错误：类型错误与 ultracite 报告需分别处理。
- 修复后**再次**对同一包运行 `pnpm fix`，直到退出码为 0。
- 不要在未通过 fix 的情况下宣称变更可交付或勾选依赖质量通过的项。
