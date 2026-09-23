---
depends_on:
  - registry://shared.terminology
name: changelog
description: >-
  按 Keep a Changelog 整理或更新仓库根 CHANGELOG.md（English）：以最新发版 tag（仅 vX.Y.Z）为基线，合并其后已提交变更与未提交工作区净效果为用户可见英文条目。Triggers：更新 changelog、写 CHANGELOG、发版说明、release notes、Unreleased、整理版本变更。
metadata:
  internal: true
---

# CHANGELOG 更新

结论：根 `CHANGELOG.md` 是给人看的**可升级决策**清单，不是 `git log`。相对最新发版 tag，只写**净效果**（基线工作树 → 当前最终态）的用户可见英文条目；禁止粘贴 commit 原文。格式遵循 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)；版本号遵循 [SemVer](https://semver.org/)。

**语言**：写入 `CHANGELOG.md` 的正文、条目与节名一律 **English**。Skill 说明可用中文。

**受众**：协议/校验使用者、CLI、VS Code 扩展用户、依赖 `@airp/*` 的开发者。用户可见文案与协议概念 → `registry://shared.terminology`（**en** / 规范英名）。

## Workflow Checklist（按序执行）

- [ ] ① 读 [./rules/scope-and-format.md](./rules/scope-and-format.md)：基线 tag、纳入范围、目标节
- [ ] ② 收集证据：`git log` / `git diff`（tag..HEAD）+ 工作区；读内容，以最终态为准
- [ ] ③ 读 [./rules/granularity.md](./rules/granularity.md)：筛不可见项，按净效果合并并归类
- [ ] ④ 对照 [./references/entry-examples.md](./references/entry-examples.md) 写成 English 用户口吻条目
- [ ] ⑤ 编辑根 `CHANGELOG.md`；勾选 [./checklists/update-changelog.md](./checklists/update-changelog.md)
- [ ] ⑥ 交用户审阅；**除非用户明确要求**，不 commit / tag / push / 创建 GitHub Release

## Anti-patterns（必须避免）

- 把 commit subject / body 原文堆进 CHANGELOG
- 用 “various bug fixes” / “various improvements” 等无信息 catch-all；或把中文写进 CHANGELOG
- 对 `[Unreleased]` 增量叠写（须整节按净效果重建）
- 改写已打 tag 的历史版本节

细则（不可见省略、未发版新能力不拆 `Fixed`、六类边界）见 `rules/*`，勿在本文件重复展开。

## 索引

- 范围、格式、版本节 → [./rules/scope-and-format.md](./rules/scope-and-format.md)
- 颗粒度与收纳 → [./rules/granularity.md](./rules/granularity.md)
- 好/坏条目对照 → [./references/entry-examples.md](./references/entry-examples.md)
- 执行清单 → [./checklists/update-changelog.md](./checklists/update-changelog.md)
