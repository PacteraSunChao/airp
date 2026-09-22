---
depends_on:
  - registry://rules.code-styles
  - registry://skills.code-fix
---

# 交付前联动（横切）

勾选任一 `registry://rules.*` / `registry://skills.*` 包内 checklist 之前，须已满足本文件与 `depends_on` 所列条目。

## 通用（始终）

- [ ] 已满足 `registry://rules.code-styles` 与 `registry://skills.code-fix` 交付要求（含 `pnpm fix` 等，见各包文档）
- [ ] 变更范围与本次任务一致，无无关文件

## 按条件追加

| 变更类型 | 须额外执行 |
|----------|------------|
| 改 `packages/**/src`、`apps/**/src`、`fixtures/airp/**` | `registry://rules.testing` + `registry://skills.test-sync` |
| 改 `AGENTS.md` / `.agents/**` / `registry.yaml` | `registry://rules.rules-meta` + `registry://rules.rules-meta.checklists.rules-meta` |
| 用户可见文案、协议概念命名、术语表相关标识符 | `registry://shared.terminology` |
| 改失败通道、诊断模型、码表条目、`AirpResult`、Ctx/Payload、CLI 人话/退出码 | `registry://rules.failure-channels` + `registry://rules.failure-channels.checklists.before-failure-channels-change` |
| 改 `supportedSchemaVersions`、版本 registry / `v….ts`、或按 schema 解释 AIRP 的模块放置 | `registry://rules.schema-version-routing` + `registry://rules.schema-version-routing.checklists.before-version-routing-change` |

（他处引用本文件：`registry://shared.delivery-prerequisites`）
