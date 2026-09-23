# 范围、格式与版本节

结论：发版基线 = 最新合法 `vMAJOR.MINOR.PATCH` tag；条目只写该基线到当前最终态的**净效果**；写入根 `CHANGELOG.md`（English），按 Keep a Changelog 六类排序。

## 发版基线

- 功能合入 `main`
- **合法发版 tag**：`v` + SemVer 三位，正则 `^v[0-9]+\.[0-9]+\.[0-9]+$`（例：`v1.1.3`）
- 其它 tag（含 `v1.2.0-rc.1`、任意后缀）**忽略**，不当基线

解析最新合法 tag（记为 `LAST_TAG`）：

```bash
git tag -l 'v*.*.*' --sort=-v:refname | while read -r t; do
  case "$t" in
    v[0-9]*.[0-9]*.[0-9]*) echo "$t"; break ;;
  esac
done
```

无合法发版 tag：范围 = 全部相关历史（首次发版），目标节版本号由用户指定。

## 纳入范围

相对 `LAST_TAG`，一并纳入：

1. **已提交高于 tag**：`LAST_TAG..HEAD`（log + diff）
2. **未提交**：staged / unstaged / untracked（须读文件内容，不能只看路径名）

**净效果** = 基线工作树与「HEAD ⊕ 选定未提交」之间的语义差。最终与基线等价（含加了又删）→ **不写**。commit 只作旁证，不作条目来源。

### 建议命令

```bash
git log "${LAST_TAG}..HEAD" --no-merges --format=medium
git diff "${LAST_TAG}..HEAD" --stat
git diff "${LAST_TAG}..HEAD"
git status --short
git diff --cached
git diff
git ls-files --others --exclude-standard
```

未提交纳入时：已跟踪文件可用 `git diff "${LAST_TAG}" --` 看相对基线的净 diff；untracked 须单独打开阅读。

### 未提交是否纳入

用户已明确说「包含未提交 / 工作区 / 全部」→ 直接纳入。

否则：若存在 pending 且目标是**具体版本节**，先简短确认再写文件。

## 目标节

| 用户意图 | 写到 |
|----------|------|
| 整理进行中变更、未指定版本 | `## [Unreleased]`（文件最前的版本节） |
| 发版 / 定版 / 给出 `x.y.z` | `## [x.y.z] - YYYY-MM-DD`（heading **不带** `v`；日期 `YYYY-MM-DD`） |

发版：把 `[Unreleased]` 中对应条目移入新版本节；**保留**空的 `## [Unreleased]` 标题（无分类子节）。

再次整理 `[Unreleased]`：按基线 → 当前最终态 **整节重建**。旧草稿仅作措辞参考；禁止追加重复项；禁止把未发版周期内的修补拆成独立 `Fixed`。

- 最新版本在上
- **不要**改写已发布（有对应 tag）的历史节
- 空分类整节省略

## 文件与格式

- 路径：仓库根 `CHANGELOG.md`
- **English only**（节名 `Added` / `Changed` / … 与全部 bullet）
- 已有 Keep a Changelog / SemVer 前言则保持，勿无故重写
- 分类顺序固定：Added → Changed → Deprecated → Removed → Fixed → Security

### 分类边界

| 节 | 含义 |
|----|------|
| Added | 基线没有、最终态有的用户可见能力 |
| Changed | 基线已有行为，现故意不同（含默认可感知变化） |
| Deprecated | 仍可用；须写替代与预期移除时机 |
| Removed | 已删除；通常 breaking |
| Fixed | 相对**上一发版**的错误行为被纠正 |
| Security | 漏洞修复；勿并入 Fixed |

产品 CHANGELOG 的 Deprecated / Removed / 迁移一句，是升级决策所需，不是在仓库里保留兼容实现。

### SemVer 提示（供用户确认，不擅自打 tag）

`Removed` 或明确 breaking → **major**；有 `Added` / `Deprecated` → **minor**；仅 Fixed / Security / 非破坏性 Changed → **patch**。回复中给建议与依据；版本号以用户确认或现有约定为准。

### Compare 链接

若文件底部已有 compare footer，发版时同步更新；没有则不必新增。

## 本仓库优先写 / 默认省略

**优先写**：

- 协议形状、`schemaVersion`、公共字段 / 块类型
- 校验行为、诊断码语义、退出码
- Renderer 输出（HTML / Markdown / Mermaid→SVG 等）
- CLI（`airp-validate` / `airp-render` 等）与 VS Code 扩展用户可见能力
- 公共 API / 包导出契约的破坏或弃用

**默认省略**：

- `.agents/**`、repo-guard、纯内部文档（非用户 README 用法变更）
- 仅测试 / fixture / CI / 格式化 / 无行为变化的重构
- 无用户影响的依赖 bump（有 CVE 或运行时变化则写**效果**，不写「bump xxx」）
