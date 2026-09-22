# 缺物件硬失败

渲染所需物件缺失时：**fail-closed**，返回 `ok: false` 诊断；不产出部分 HTML/Markdown 冒充成功。

## 规则

| 情况 | 行为 |
|------|------|
| 文档无法敲定 locale（1.1.0 无 `i18n.locale`；1.0.0 无 `i18n.defaultLocale`） | 诊断 `error` → `ok: false` |
| 未知 block `type`（本 target 未实现） | 诊断 `error` → `ok: false` |
| Mermaid 源码在导出期 `render` 失败 | 诊断 `error` → `ok: false` |
| 必填 LocalizedString 在敲定 locale 下无可用文案 | 诊断 `error` → `ok: false` |

## 禁止

- 页内静默跳过必渲染块并仍 `ok: true`
- 用占位「图裂」文案掩盖 Mermaid 导出失败（与图片 URL 外联无网图裂可接受不同）
