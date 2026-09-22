---
depends_on:
  - registry://rules.code-styles
  - registry://shared.delivery-prerequisites
name: code-fix
description: 凡新增或修改受仓库质量脚本约束的源码文件（例如 `*.ts`、`*.tsx`、`*.js`、`*.jsx`、`*.mjs`、`*.cjs` 等），交付前须对本次变更涉及的 workspace 包执行 `pnpm fix` 直至通过。Triggers：改代码、pnpm fix、自动修复、ultracite fix、交付前检查。
---

# pnpm fix（post-change）

铁律：`SKILL.md` 只保留骨架与索引；命令细则/扩展名/例外见 `rules/*`，可勾选步骤见 `checklists/*`。其它专项 Skill 可追加步骤，但不得免除本 Skill 的 `rules` / `checklists`（除非 `rules` 明确列出例外）；并仍需满足 `registry://rules.code-styles` 与本次任务命中的其它专项 Skill。

## Workflow Checklist（复制后逐项勾选）

- [ ] 依据 [./rules/post-change-fix.md](./rules/post-change-fix.md) 确认本次变更是否命中「须执行」范围（含例外）
- [ ] 按 [./checklists/post-change-fix.md](./checklists/post-change-fix.md) 对变更包执行 `pnpm fix`

## Anti-patterns（必须避免）

- 在须执行范围内跳过 `pnpm fix` 仍宣称「可交付」或勾选依赖质量通过的 checklist
- 仅改单个包却未对该包执行 fix（根目录 `pnpm fix` 会跑全量，本地迭代优先 `--filter`）

## 索引

- rules/checklists 总入口 → [./rules/post-change-fix.md](./rules/post-change-fix.md)
