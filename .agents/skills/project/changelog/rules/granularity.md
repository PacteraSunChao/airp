# 颗粒度与收纳边界

结论：一条条目 = **一个独立、用户可感知的结果**（能力 / 行为 / 契约）。按净效果合并；分类定义见 [./scope-and-format.md](./scope-and-format.md)。

实用目标：每个版本大约 **3～15** 条；纯 patch 可为 1～3 条。过多像 commit dump，过少且含糊则不可信。

## 净效果合并规则

1. 先看基线 vs 最终态，再看 commit 叙事。
2. 同一能力在发版前新增并反复修补 → **一条 `Added`（写最终形态）**；不要 `Added` + 多条「修新功能的 Fixed」。
3. 仅当缺陷相对**上一发版 tag 已存在的行为**时，才进 `Fixed`。
4. 多个 commit 描述同一结果 → **合并为一条**。
5. 最终态与基线等价（含加了又删）→ **不写**。

## 决策表

| 情况 | 写法 |
|------|------|
| 新 CLI 能力 / 新块类型 / 新 schema 字段 / 新诊断码语义 | **单独一条** `Added`（或 Changed，若是改已有语义） |
| Breaking / Deprecated / Removed / Security | **必须单独写清**；可附一句迁移或替代 |
| 同一主题的多个小修（共症状或共模块） | **收成 1 条**，写主题；可选括号举 1～3 例 |
| 互不相关、用户可能分别关心的 bug | **各写一条** |
| 仅 CI、测试、格式化、纯重构、无感依赖 bump | **省略** |
| 依赖变更但修好漏洞或改变运行时 | 按效果进 Security / Fixed / Changed |
| 用户可见 README / 用法变更 | 可写；纯内部注释 / agents 规范 → 省略 |
| 「各种改进」/ “various improvements” 无主题 | **禁止** |

## 可收成一句 vs 必须分行

**可收成一句**（仍须有主题）：

- 同一表面症状的多处修复  
  Example: `Fixed: validate-cli no longer exits abnormally on several invalid inputs (empty file, non-JSON)`
- 同一已有能力的一簇 polish，且无一值得单独升级决策

**必须单独一行**：

- 任一 breaking、弃用、删除、安全项
- 改变诊断码、退出码、schema、公共 API 的项
- 用户会按功能点检索的新能力（“support X” 与 “fix Y padding” 勿合并）

## 条目写法

- **English only**
- 用读者词汇写 symptom / capability / impact，不用内部类名、文件路径堆砌
- 默认一行一条；标识符用规范英名（`registry://shared.terminology` 的 en / 规范英名）
- Breaking 放在所在节靠前，必要时加简短英文升级说明
- 有关联 issue / PR 时可在句末附 `(#123)`，非必须
