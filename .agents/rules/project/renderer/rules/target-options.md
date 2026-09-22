# 目标渲染器配置（target-options）

`RenderContext.targetOptions` 与各 target 认 key 的约定。类型落在 `renderer-contract`；pipeline 透传；各 target 文档认 key。

## 共享槽

| 项 | 约定 |
|----|------|
| 类型 | `targetOptions?: Readonly<Record<string, unknown>>` |
| 出现位置 | `RenderContext` → `ResolvedRenderContext`；编排层不解释 key |
| 省略 | 等于该 target 默认产物 |
| 未知 key / 类型不符 | **跳过该 key**，不因此失败 |
| 禁止 | 在 contract 导出某 target 专用 options 类型 |

封闭 target 集合：`html` \| `markdown`（默认 `html`）。

## HTML 认的 key

均为 `string`；缺席、非 string、或未知 key → 跳过。

| key | 效果 |
|-----|------|
| `extraHeadPre` | 插入 `<head>` 内、`#airp-color-scheme-apply` **之前**（同步预填亮暗色等） |
| `extraHead` | 追加到 `head` 末尾（CSP、宿主样式等） |
| `extraBody` | 追加到 `body` 末尾 |
| `extraAppHeader` | 追加到顶栏右侧 `[data-app-header-trailing]` 末尾；非空时包 `<div data-extra-app-header="true">…</div>`；HTML target **不为宿主私有 class 写样式** |

## 宿主注入边界

| 侧 | 做 | 不做 |
|----|----|------|
| HTML target | 提供槽位、icon sprite、离线自持壳；亮暗色经 `localStorage` + `airp-color-scheme` 文档事件 | 不写宿主私有选择器进阅读器 CSS；不依赖具体宿主 app；不引入 Basecoat；不把 webview `#_defaultStyles` 重置写进 `tokens.css` / `input.css` |
| 宿主（`renderer-vscode`） | 经 `extra*` 注入 CSP / 按 VS Code 主题预填亮暗色 / 导出 / bridge；`extraHead`（及错误壳）注入无层 webview 重置并移除 `#_defaultStyles`（`body` padding/margin、裸 `code` 等）；导出菜单与真源参考同壳（`rounded-xl`、`p-2`、`--shadow-float`、slate 行 hover、`.airp-float-panel` 开合）；桌面悬停开启、离开 260ms 宽限关闭，触屏点击开合；隐藏阅读器亮暗色开关；主题变更经 `airp-color-scheme` 事件同步；与阅读器同文档吃 CSS/sprite | 不平行拷贝 token；不为阅读器另起图标真源；不提供独立亮暗色配置 |

CLI / 无宿主：插槽为空仍可离线打开（无 webview 默认样式重置）。

webview 重置细则见 `registry://rules.renderer.rules.html-styles`。

## 禁止

- `<base href>` 解决资源路径
- 未知/错类型 key 导致整次 render 失败
- HTML target 为宿主私有 `data-*` / class 写样式或业务逻辑

## 维护

新增/修改认的 key 或注入边界时，同步本文与实现；插槽注入须有 Package 测试断言。
