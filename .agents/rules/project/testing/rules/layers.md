# Unit / Package / E2E 测试分级

各 Tier scope、runner 位置与 owner。改实现时先判定 Tier，再只动对应 case / fixture。

## Tier 矩阵

| Tier | 范围 | Runner / 位置 | 入口 |
|------|------|---------------|------|
| Unit | 单模块逻辑；mock 或最小假数据；不读 fixtures 磁盘 | 各包 `*.test.ts` | 包内 `pnpm test` |
| Package | 包对外职责；可用 fixtures + 真实下游 | owner 包 case 驱动测试 | 包内 `pnpm test` |
| E2E | 用户入口全链路（CLI spawn；未来 Web HTTP） | apps case 驱动 `cli.test.ts` + 共享 runner | 包内 `pnpm test` |

- **packages/\***：必须 Unit + Package。
- **apps/\***：必须 Unit + E2E，按需 Package。

## `pnpm test`

- 根目录 `pnpm test` 聚合各 workspace 包的 `vitest run`。
- **无**分层 `test:*` script；定向调试用 `pnpm --filter <pkg> test` 或 vitest 文件路径（`<pkg>` 见 `pnpm list-testing-surface`）。
- 交付前至少跑根目录 `pnpm test`。

## 事实源导航

| 想知道 | 打开 |
|--------|------|
| 全仓测试结构一览 | 根 `pnpm list-testing-surface` |
| 包含哪些 Tier、是否 case-driven | 本包 `test/surface.json` |
| Package / E2E case 注册 | 同上 → `cases[]`（`file` 相对 `test/`） |
| case 字段形状 | `packages/test-kit/src/types.ts` |
| 诊断码表条目与覆盖 | 各包 `src/diagnostic-codes.ts` + `test/diagnostic-code-coverage.test.ts`（若存在） |
| 该补什么 case / fixture | `registry://skills.test-sync` → `rules/change-sync-matrix.md` |

结构登记由 `pnpm check-testing-surface`（经根 `pnpm check` / `pnpm fix`）机械校验。

## Owner 判定

1. **默认**：改动路径所在的 workspace 包即为 owner。
2. **跨包 case**：查 `pnpm list-testing-surface` → `cases[]` 中登记的 export（如 `schemaCases`、`pipelineCases`）所在包。
3. **非 case-driven 包**：owner = 改动所在包；补 Unit / Package 测试于本包 `test/`。

## 禁止

- 在 owner 包之外重复同类型 Package case（以 `surface.cases` 登记为准）。
- 在触盘 fixture 的测试中手写路径；须 `documentPath()`（或 test-kit 等价 helper，来自 `@airp/test-kit`）。
- 在业务 `src` 使用裸诊断码字符串或手填 `severity`；须 import 本包码表条目，经 `diagnostic(entry, …)` 产出。
