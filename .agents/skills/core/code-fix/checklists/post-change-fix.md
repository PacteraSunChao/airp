---
depends_on:
  - registry://rules.code-styles
  - registry://shared.delivery-prerequisites
---

# `pnpm fix` 交付前校验清单

将变更涉及的 workspace 包名填入下方（如 `@airp/validate`）。

## 必做（当 rules 判定须执行 fix 时）

- [ ] 已对每个变更包执行：`pnpm --filter <package-name> fix`（或在包目录内 `pnpm fix`）
- [ ] 命令退出成功（退出码 0）；若失败已修复并重跑直至通过
- [ ] 交付前已在根目录执行 `pnpm check` 或 `pnpm fix`（全量），或确认 CI 会跑全量 check

## 联动

- [ ] 若命中其它专项 Skill：已按其 checklist 完成（不替代本清单中的 fix）
- [ ] 通用编码与命名等：已按通用编码规范完成本次命中项（见 `registry://rules.code-styles`）
