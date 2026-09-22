---
depends_on:
  - registry://rules.testing
  - registry://shared.delivery-prerequisites
  - registry://skills.code-fix
name: test-sync
description: 新增或修改 packages/**/src、apps/**/src、fixtures/airp/** 时，同步 Unit/Package/E2E 测试、case 与 fixture，并跑 pnpm test 直至通过。Triggers：改校验逻辑、诊断码/码表条目、schema、pipeline、CLI、fixture、补测试、test sync、测试同步。
metadata:
  internal: true
---

# 测试同步（post-change）

铁律：实现与测试须**同一轮变更**交付；须先满足 `registry://rules.testing`，交付前须完成根 `pnpm fix` + 根 `pnpm test`。

**结构事实 SSOT**：各 workspace 包的 `test/surface.json`；类型见 `@airp/test-kit` → `PackageTestSurface` / `CaseRegistryEntry`。全仓一览：根 `pnpm list-testing-surface`。

## Workflow Checklist（按序执行）

- [ ] ① 读 [./rules/change-sync-matrix.md](./rules/change-sync-matrix.md)，按**变更信号**判定命中行与必同步 artifact
- [ ] ② 读涉及包的 `test/surface.json`（`tiers`、`cases`）；可跑 `pnpm list-testing-surface`
- [ ] ③ 同轮更新 src、本包 `diagnostic-codes.ts`、case 注册表与/或 `fixtures/airp/`、`test/surface.json`（若新增包）
- [ ] ④ 根目录 `pnpm test` 全绿
- [ ] ⑤ 根目录 `pnpm fix` 全绿（含 `check-agents-registry`）
- [ ] 勾选 [./checklists/post-change-test.md](./checklists/post-change-test.md)

## Anti-patterns（必须避免）

- 先合 `src` 再补 case / fixture（须同轮交付）
- 新增 originate 诊断码不以码表条目写入本包 `diagnostic-codes.ts`，或不补 Package/E2E case 或 `UNIT_COVERED_*` + Unit 单测
- 在 `usesFixtures: true` 的测试里手写 `../../fixtures`（须 `@airp/test-kit` paths）
- 在包内新建 `test/fixtures/`（须用 `fixtures/airp/` + test-kit paths）
- 把 `.docs/samples/` 当合同输入
- 在 case 驱动 `*.test.ts` 手写大段重复 runner 逻辑（须 `describe.each(cases)` + 共享 runner）
- HTML/UI 断言钉 CSS class、精确 markup 或 SVG path（须 `registry://rules.testing.rules.assertion-style`）
- 跳过 matrix 要求的 `pnpm test` 仍宣称「可交付」

## 索引

- 变更同步决策表（语义）→ [./rules/change-sync-matrix.md](./rules/change-sync-matrix.md)
- 交付前测试清单 → [./checklists/post-change-test.md](./checklists/post-change-test.md)
- 分层原则与导航 → `registry://rules.testing`
- 断言风格 → `registry://rules.testing.rules.assertion-style`
