# 语言敲定（locale）

## 结论

- 渲染语言**只来自文档**，CLI / 宿主不传 locale。
  - **1.1.0**：`document.i18n.locale`
  - **1.0.0**：`document.i18n.defaultLocale`
- 推导一次后写入 `ResolvedRenderContext.locale`；折叠与 html-locale 查包均使用该字符串。
- 渲染期将所有 `LocalizedString` / 富文本按该 locale 折叠为最终字符串后写入产物。
  - **1.0.0**：object map 取文档敲定 locale 键；缺失则失败。
  - **1.1.0**：文案仅为 plain string；无 locale map。
- 换语言 = 改文档 locale 字段后重新 `export` / `watch`；产物内无运行时语言切换器。

## 折叠

| 形态 | 行为 |
|------|------|
| plain `string` | 原样使用 |
| object map（仅 1.0.0） | 取文档敲定 locale 键；缺失则失败（见 `missing-object-hard-fail`） |
