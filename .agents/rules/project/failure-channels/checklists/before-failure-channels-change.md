---
depends_on:
  - registry://shared.delivery-prerequisites
---

# 改失败通道 / 人话输出前 — 校验清单

**对应规则**：`registry://rules.failure-channels`

- [ ] 通道选择符合 `registry://rules.failure-channels.rules.channels`（领域失败 → `AirpResult`；意外 → throw；CLI 用法 → UsageError / 退出 1）
- [ ] 新/改诊断码以码表条目 `{ code, severity }` 写入本包 `diagnostic-codes.ts`；throw 锚点条目已标明（`registry://rules.failure-channels.rules.codes`）
- [ ] 业务经 `diagnostic(entry, …)` 产出诊断；未手填 `severity`；throw 锚点未经 `diagnostic()` 进 Result
- [ ] 结果经 `airpResultFrom`（或同名 helper）构造；`ok` 与是否含 `error` 一致
- [ ] 写袋经 `ctx`（最后一参）；payload 类型在 utils
- [ ] 人话 body 来自 `formatDiagnostic`（`.`）；log* 来自 `diagnostics`（`.`）；用法错误无 `internal error:` 前缀；级别词为 Logger 固定 tag（`utils` `.` / `utils/node` 宿主）
- [ ] CLI 退出码符合 `registry://rules.failure-channels.rules.human-output`
- [ ] 覆盖与严重级别核对符合 `registry://rules.testing.rules.case-model`
- [ ] 符号落在 `diagnostics`（`.`）或 `utils`（`.` / `node`）的职责内（`registry://rules.package-boundaries`）
