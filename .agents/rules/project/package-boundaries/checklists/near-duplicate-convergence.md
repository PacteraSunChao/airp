---
depends_on:
  - registry://shared.delivery-prerequisites
---

# 跨包近重复 — 校验清单

**对应规则**：[`rules/near-duplicate-convergence.md`](../rules/near-duplicate-convergence.md)

- [ ] 涉及 ≥2 个 packages/apps
- [ ] 已三选一：同契约 / 无意漂移 / 有意分叉
- [ ] 若收敛：落点按「已有导出 → 职责包 → utils（仅 A/B/C）」且依赖边合法
- [ ] 若进 utils：满足 [utils-admission](../rules/utils-admission.md)
- [ ] 若分叉：名称与注释标清差异
- [ ] 副本实现与重复测试已删或改为依赖权威实现
