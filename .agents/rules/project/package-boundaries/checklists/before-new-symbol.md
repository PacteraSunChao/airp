---
depends_on:
  - registry://shared.delivery-prerequisites
---

# 新增符号前 — 校验清单

**对应规则**：[`rules/package-roles.md`](../rules/package-roles.md)、[`rules/dependency-dag.md`](../rules/dependency-dag.md)、[`rules/utils-admission.md`](../rules/utils-admission.md)

- [ ] 已按 [package-roles](../rules/package-roles.md) 判定归属包
- [ ] 已按 [workspace-layout](../rules/workspace-layout.md) 选定或核对 platform（`isomorphic` / `node` / `dual`）；dual 符号进 `.` 还是 `./node`
- [ ] 已检索近重复；若有，先按 [near-duplicate-convergence](../rules/near-duplicate-convergence.md) 处理
- [ ] 若目标为 `utils`：硬条件与复用面 A/B/C 至少一条已满足；并选定 `.` 或 `./node`（`utils-admission`）
- [ ] 若涉及失败通道 / 诊断 / Result / Ctx / 人话：已对照 `registry://rules.failure-channels`（log* → `diagnostics` `.`）
- [ ] 依赖边与运行时入口符合 [dependency-dag](../rules/dependency-dag.md)（含 `node:` 写法、同构范围、`/node`）
- [ ] 无循环、无逆层；业务包运行时未依赖 `test-kit` / `repo-guard` / `apps/*`
- [ ] 公开导出与 [workspace-layout](../rules/workspace-layout.md) 职责一致；未引入 Registry / 组装包
