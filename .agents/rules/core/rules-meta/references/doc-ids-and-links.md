# 文档 ID 与链接

## 文档 ID（`registry://`）

**canonical 形式：**

```text
registry://<section>.<slug>[.<nested-key>...]
```

- **section**：`rules` | `skills` | `shared`
- **slug**：registry 顶层键（如 `code-styles`、`rules-meta`、`code-fix`）；**不含** `<tier>`
- **可选后缀**：registry 嵌套键路径（如 `checklists.naming`、`references.directory-layout`）

### 正文中的引用

- **必须**写完整前缀：`` `registry://rules.code-styles` ``
- **禁止**省略 `registry://` 的裸文档 ID；check-agents-registry 仅当该裸串对应 registry 中已有条目时报错（避免误伤同形的非文档字符串，如 html-locale key）
- 跨包引用**一律**用文档 ID，不用相对路径
- 正文出现的 `` `registry://...` `` 须能在 registry 中解析

### 包内链接

同一 rule / skill / shared 包内，继续使用 Markdown 相对链接，例如：

- 从包入口链到子文档：`./references/<file>.md`（路径因包而异）
- 从子文档链回包入口：`../README.md` 或 `../SKILL.md`

check-agents-registry 会校验包内链接目标存在，并**拒绝**指向其它包的相对链接。

## 常见错误

| 错误 | 正确做法 |
|------|----------|
| 跨包相对路径链接（如 `../../other/README.md`） | 正文写 `` `registry://rules.code-styles` `` |
| 索引标题与 README `#` 不一致 | 两处使用相同字符串 |
| 新增 `.md` 未写入 registry | 在对应 slug 下增加嵌套键与路径 |

frontmatter 与 `depends_on` 见 [`./frontmatter.md`](./frontmatter.md)。
