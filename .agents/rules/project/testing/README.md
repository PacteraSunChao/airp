# 测试分层与同步规范

本项目 **Unit / Package / E2E 测试分级、case 模型与 fixture 约定** 的 SSOT。**细则在** [`rules/`](./rules/)，交付工作流见 `registry://skills.test-sync`。

**结构事实**（各包 Tier、case 注册）：各 workspace 包的 `test/surface.json`；类型由 `@airp/test-kit` 导出。不确定 owner 或 case 登记时，跑根目录 `pnpm list-testing-surface`。

## 规则

| 域 | 何时读 | 文档 |
|----|--------|------|
| Unit / Package / E2E 分层与导航 | 不确定测哪一层 | [`rules/layers.md`](./rules/layers.md) |
| Case 类型与注册 | 新增/修改 SchemaCase、LoadCase、PipelineCase、CliCase | [`rules/case-model.md`](./rules/case-model.md) |
| Fixture 目录与命名 | 新增/移动 `fixtures/airp/documents/**` | [`rules/fixtures.md`](./rules/fixtures.md) |
| 断言风格（行为优先） | 编写 HTML/UI 或易碎字符串断言时 | [`rules/assertion-style.md`](./rules/assertion-style.md) |
| 变更同步决策 | 该补什么 case / fixture | `registry://skills.test-sync` → `change-sync-matrix` |

## 核心原则

1. **Tier 单一职责**：Unit 测单模块；Package 测包对外职责；E2E 测用户入口（详见 [layers](./rules/layers.md)）。
2. **Case 驱动**：Package / E2E 测试文件保持薄（`describe.each(cases)` + 共享 runner）；行为变更改 case 数据，不改 runner。
3. **Fixture SSOT**：仅 `fixtures/airp/`；禁止在包内维护私有 fixture 根。
4. **行为优先断言**：测可观察结果与稳定契约，不钉 CSS class / 精确 HTML / SVG path（详见 [assertion-style](./rules/assertion-style.md)）。
5. **机械门禁**：各 owner 包 `diagnostic-code-coverage.test.ts`、`schema-coverage.test.ts` 等；各包 `test/surface.json` 由 `check-testing-surface` 在根 `pnpm check` / `pnpm fix` 中校验。
6. **同轮交付**：实现与测试在同一变更中完成；不得先合 src 再补测。

## 交付前

- 改 `packages/**/src`、`apps/**/src` 或 `fixtures/airp/**` 时，须执行 `registry://skills.test-sync`。
- 勾选任一 rule / skill checklist 前，须先满足 `registry://shared.delivery-prerequisites`。
- 交付 = 根 `pnpm test` 全绿 + 根 `pnpm fix` 全绿。

## 维护

- **禁止**在索引页复制 `rules/*` 长文；改规则只改 `rules/*`。
- **禁止**在 `.agents` 文档中列举具体包名与 case 文件路径；可变事实只登记在 `test/surface.json`，用 `pnpm list-testing-surface` 查询。
- 新增带 `test` script 的包须新增 `test/surface.json`（含 `tiers`；case-driven 时含 `cases`）。
- pipeline / schema / load case 变更在 **owner 包** 与 `fixtures/airp/` 同步，不在 test-kit 集中维护 case 数据。
