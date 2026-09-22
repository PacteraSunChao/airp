---
depends_on:
  - registry://shared.delivery-prerequisites
---

# Biome 风格守卫 — 校验清单

**对应规则**：[`rules/biome-style-guards.md`](../rules/biome-style-guards.md)

- [ ] 控制流使用块语句，无嵌套三元
- [ ] 单函数认知复杂度 ≤ 20（测试文件豁免）
- [ ] 已对变更包执行 `pnpm fix` 并通过（见 `registry://skills.code-fix`）
