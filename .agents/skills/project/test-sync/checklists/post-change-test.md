---
depends_on:
  - registry://shared.delivery-prerequisites
  - registry://rules.testing
---

# 测试同步 — 交付前校验清单

## 判定

- [ ] 已读 [../rules/change-sync-matrix.md](../rules/change-sync-matrix.md) 并确认命中行
- [ ] 已跑 `pnpm list-testing-surface` 或读涉及包的 `test/surface.json`（`tiers`、`cases`）
- [ ] 已读 `registry://rules.testing` 中相关 rule（layers / case-model / fixtures / assertion-style）

## 必做（当 matrix 判定须同步测试时）

- [ ] 已同轮更新 owner 包 `surface.cases` 登记的 case 文件或包内 `test/`
- [ ] 已更新 `fixtures/airp/`（若行为依赖新输入）
- [ ] 新 originate 诊断码已以码表条目写入本包 `diagnostic-codes.ts`，被 Package/E2E case 或 `UNIT_COVERED_*` + Unit 覆盖；结果 `severity` 与条目一致（不在 case 里抄期望 `severity`）
- [ ] 新增带 `test` script 的包已添加 `test/surface.json`
- [ ] case id 与 fixture 路径命名一致
- [ ] 未硬编码 fixture 路径（使用 `@airp/test-kit` 的 `documentPath` / `testingRelPath`）
- [ ] 未在包内新建私有 fixture 根

## 命令

- [ ] 已跑根 `pnpm test`，退出码 0
- [ ] 已跑根 `pnpm fix`（含 `check-agents-registry`、`check-testing-surface`），退出码 0

## 联动

- [ ] 未跨 Tier 重复测试（见 `registry://rules.testing.rules.layers`）
- [ ] 新增/改写断言符合行为优先风格（见 `registry://rules.testing.rules.assertion-style`）
- [ ] 改 CLI app：E2E 动 `cases` 登记的 cli case 文件；Unit 动 parse-args / 输出格式化等
