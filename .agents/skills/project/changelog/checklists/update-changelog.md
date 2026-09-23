---
depends_on:
  - registry://skills.changelog
  - registry://shared.delivery-prerequisites
---

# CHANGELOG 更新 — 执行清单

**对应 Skill**：[`CHANGELOG 更新`](../SKILL.md)

## 范围

- [ ] 已解析最新合法发版 tag（仅 `vMAJOR.MINOR.PATCH`），记为基线；无 tag 时已与用户确认首次发版范围
- [ ] 已纳入 `基线..HEAD` 的提交与 diff
- [ ] 未提交变更：已按用户意图纳入或明确排除；纳入时已读内容（含 untracked）
- [ ] 条目来自净效果，而非逐条 commit 翻译

## 内容

- [ ] 已按 [../rules/granularity.md](../rules/granularity.md) 省略不可见变更并按净效果合并
- [ ] 未发布周期内的新能力修补已并入 `Added` / 对应主条，未误标为相对上版的 `Fixed`
- [ ] Breaking / Deprecated / Removed / Security（若有）已单独写清
- [ ] 无无信息 catch-all；条目为 **English**；协议/产品概念用语符合 `registry://shared.terminology`（en / 规范英名）
- [ ] 对照 [../references/entry-examples.md](../references/entry-examples.md) 完成 English 用户口吻改写
- [ ] `CHANGELOG.md` 中无中文正文/条目

## 文件

- [ ] 已更新仓库根 `CHANGELOG.md`
- [ ] 目标节为 `[Unreleased]` 或 `## [x.y.z] - YYYY-MM-DD`（与用户意图一致）
- [ ] 若目标为 `[Unreleased]`：已按基线 → 最终态 **整节重建**（未在旧草稿上追加）
- [ ] 若本次为发版：新版本节已写入；空的 `## [Unreleased]` 标题已保留（无分类子节）
- [ ] 分类顺序为 Added → Changed → Deprecated → Removed → Fixed → Security；空节已省略
- [ ] 未改写已发布历史版本节
- [ ] 若存在 compare footer，已按需更新

## 收尾

- [ ] 已向用户说明建议的 SemVer bump（若相关）与主要条目摘要
- [ ] 未擅自 commit / tag / push / 创建 Release（除非用户明确要求）
