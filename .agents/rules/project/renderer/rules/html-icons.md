# html-icons（HTML 渲染器图标）

适用于 `packages/renderer-target-html` 内阅读器壳与控件图标。

## 结论

- 方案：Lucide + `manifest.yaml` 按需 codegen + **文档级 SVG sprite**。
- 组装时 `renderIconSprite()` **只写一次**；调用点 `renderIcon()` → `<use href="#airp-icon-…">`。
- 最终文档零外链、零 Lucide 运行时；禁止 Phosphor / CDN / 外链图标方案。

## 真源

| 类别 | 路径 |
|------|------|
| 白名单 | `packages/renderer-target-html/src/icons/manifest.yaml` |
| codegen | `pnpm --filter @airp/renderer-target-html icons:generate` → `catalog.ts` |
| 覆盖（Lucide 已移除的品牌标等） | `src/icons/overrides/<name>.svg`；codegen 优先读覆盖再回落 Lucide |
| 渲染 | `render-icon.ts`（`renderIcon` / `renderIconSprite`） |

## 壳与控件必选 icon（须进 manifest）

| icon | 用途 |
|------|------|
| `layers` | 顶栏产品标识（定稿品牌标） |
| `sun` / `moon` | 亮 / 暗 |
| `github` | 页脚仓库链接；`embed` 指向 GitHub 时的卡片标 |
| `external-link` | `linkList` 行内外链提示；`embed` 卡片尾部 |
| `book-open` | 非 GitHub `embed` 卡片标 |
| `copy` / `check` | 代码复制与成功态（约 3 秒） |
| `plus` / `minus` / `rotate-ccw` | `svg-viewer` 放大 / 缩小 / 复原 |
| `chevron-down` | `collapsible` 折叠指示（`group-open:rotate-180`） |
| `download` | 宿主（`renderer-vscode`）顶栏导出 |
| `file-text` / `git-branch` / `cpu` / `folders` | 文档标签条 |
| `user-round` / `calendar` / `git-pull-request` | 正文标题区元数据与来源 |
| `trending-up` / `trending-down` / `arrow-down-right` | hero 指标 delta |
| `info` / `lightbulb` / `circle-check` / `triangle-alert` / `shield-alert` | callout 五态 |

新增调用点前先扩 manifest 再 codegen；禁止平行手写 path。

## 使用

```typescript
import { renderIcon } from "../icons/render-icon";

`${renderIcon("sun", { className: "size-4 shrink-0" })}`
```

- 尺寸与颜色用 Tailwind utility；SVG 用 `currentColor`。
- 宿主经 `extra*` 注入、与阅读器同文档的图标同样须进 manifest（禁止平行 Lucide 真源）。

## 禁止

- 运行时 Lucide JS / CDN / 外链图标
- 全量引入 `lucide-static`
- 手写 path 或复制 catalog 内容
- 每处重复内联同一 icon path

## 测试

断言 `<use href="#airp-icon-…">` 与 sprite 出现一次；禁止钉 SVG path 几何。见 `registry://rules.testing.rules.assertion-style`。
