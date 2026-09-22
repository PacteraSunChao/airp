# 模块放置（monorepo）

源码按 **pnpm workspace** 边界组织；跨包依赖通过 `workspace:*` 声明。

## 顶层布局

| 路径 | 用途 |
|------|------|
| `packages/*` | 可复用库与仓库基础设施 |
| `apps/*` | 可执行应用与 CLI |
| `.agents/` | AI 规范与 skill 文档 |

## 包内布局

- 入口：`src/index.ts`（或包 `package.json` 中 `main` / `types` 所指文件）
- 测试：`test/` 或与源文件同级的 `*.test.ts`
- fixture：`test/fixtures/`（校验器、协议等需要样例时）

## 依赖方向

- `apps` 可依赖 `packages`；`packages` **不应**依赖 `apps`
- 低层包不依赖高层包
- 新增包时同步更新 `pnpm-workspace.yaml` 与 `turbo.json` 任务

## 禁止

- ❌ 在 `packages` 之间通过相对路径绕过 workspace 依赖（应声明 `package.json` dependencies）
- ❌ 将业务逻辑散落在仓库根目录
