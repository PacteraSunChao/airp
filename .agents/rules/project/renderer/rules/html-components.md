# html-components（HTML 渲染器组件钩子）

适用于 `packages/renderer-target-html` 内**身份与行为钩子**（`data-*`、client 选择器）及壳层结构终态。版式 class/`style` 写法见 `registry://rules.renderer.rules.html-styles`。

**不适用**：`targetOptions` 未知 key（见 `registry://rules.renderer.rules.target-options`）；积木字段语义（见协议）。

## 结论

1. 外观：emit 写 Tailwind utility + 主题 `style` 变量；行为钩子用 `data-*` / 约定选择器。
2. 作者面配置用短 `data-*`；runtime 态用 `data-{component}-*`（如 `data-svg-viewer-initialized`、`data-doc-time`、`data-code-copy`）。
3. 初始化幂等：`data-{component}-initialized`；自研 boot。禁止 Basecoat。
4. 选择器限定组件根。
5. 每个 `Block.type` 有 emit；**视觉根即契约根**（同元素挂 `data-block-type` 与版式）；不向读者输出 type / `meta.kind` / `importance` / 布尔原文 / **协议 `block.id` 文本**（`id` 仅可作 HTML 锚点属性，不作徽标或正文）。
6. `agentNote` 仅 `visible === true`；`embed` 为可点外链。
7. 文案对人话（如刚性约束徽标），不打印协议布尔字面量。

## 交互反馈

可点击壳层控件（亮暗色切换、真源参考触发器、代码复制、collapsible summary、embed 卡等）统一加 `airp-interactive`。该类在 `input.css` 中用 `:hover !important` 覆盖 inline 主题 `style` 的 `background-color` / `color` / `border-color`，避免 Tailwind `hover:` 被 inline 压掉。

## 壳层 DOM

| 区域 | 终态 |
|------|------|
| 顶栏 | `sticky top-0 z-40`；左：天蓝圆角品牌标（雪碧图 `layers`）+「AIRP Renderer」；右：主题按钮（两态 light/dark，文案 `sr-only`；`cursor-pointer` + hover 背景/字色反馈）+ 可选 `extraAppHeader`（包在 `data-app-header-trailing`） |
| `main` | `flex-1 w-full min-w-0 max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-10`；`data-route-path="/"` |
| 正文 | `article.min-w-0.space-y-8.sm:space-y-12`；首块为 `[data-doc-header]` |
| 本页目录 | 可选 `nav[data-page-toc]`（见下）；置于 `main` 与页脚之间 |
| 文档头 | 协议徽标 `AI Report Protocol v{schemaVersion}`；tags；唯一 `h1`；副标题；**1.0.0**：作者 + `data-doc-time`（标签「更新时间」）；**1.1.0**：`data-doc-last-updated` 一行「最后更新：updatedBy + 本地时间」（`data-doc-time-by`）；同行右侧 `[data-doc-sources-menu]`「真源参考」菜单（触发器扁平：button + `airp-interactive`，无 elevation；展开面板标题旁可保留计数，列出全部 `sourceRefs`）；桌面悬停 / 触屏点击以 `data-open` 开合（与导出菜单同式，不用 `details`，以便 `.airp-float-panel` 过渡），离开后 260ms 宽限关闭，fixed 浮层按视口定位并自动上下翻转，面板 `.airp-float-panel` + `box-shadow: var(--shadow-float)`（与本页目录同开合动效）；无 `kind` |
| 更新时间 | 优先 `updatedAt` 否则 `createdAt`；SSR `<time datetime>`；客户端本地 `(UTC{±offset}) YYYY/MM/DD HH:mm`；1.1.0 归因优先 `updatedBy` 否则 `createdBy` |
| 页脚 | 左 `AIRP Renderer v… • AI Report Protocol v{schemaVersion}`（取自 airp.json）；右 github 图标 + 仓库链接；主题表面用 CSS 变量 `style` |

## 积木根节点

每个 `Block.type` 的**视觉根即契约根**：同一元素挂 `data-block-type` 与终态 utility/`style`（禁止外层空壳再包一层已定稿框）。

### `section`

| `level` | 根 class / 标题 |
|---------|-----------------|
| 1 | 首个：`space-y-8 pt-4`；其后：`space-y-8 pt-6 border-t`。标题区 `border-b pb-3` → `h2`（`text-2xl sm:text-3xl font-bold`）+ 可选 lead |
| 2–3 | `space-y-6 pl-0 border-transparent`；标题行 `flex` → `h3`（L2：`text-xl sm:text-2xl`；L3：`text-lg sm:text-xl`） |
| 4 | `p-3.5 rounded-lg border border-dashed` + subtle 面；`h5`（`text-sm font-semibold`） |

`section.level` 驱动大纲深度；文档唯一 `h1` 仅在文档头。标题全文输出（不拆序数 span）。须有锚点 `id`。

### 本页目录（`nav[data-page-toc]`）

Notion 式右侧浮动大纲：默认隐喻短横列；桌面悬停展开，触控 / 平板点按展开。

| 项 | 终态 |
|----|------|
| 收录 | 仅 `section`（含嵌套）；不收文档头 `h1`、独立 `heading` / `group` / `hero` |
| 出现条件 | `section` 条目 ≥ 2；否则不输出 |
| 放置 | `main` 与页脚之间；`fixed`；`top` 相对视口固定（不随滚动、不吸附顶栏）；水平贴 `main`（`max-w-4xl`）右侧 gutter，宽屏不贴视口右缘；隐喻与展开面板共用同一右上角锚点；`md`（≥768px，平板起）显示，手机隐藏 |
| 隐喻态 | `[data-page-toc-mini]`：每节一根短横；`data-toc-level` 控长度（L1 最长 → L4 最短）；当前项 `data-toc-active="true"` |
| 展开态 | `[data-page-toc-panel].airp-float-panel`：从同一右上角展开的白底圆角浮层 + `box-shadow: var(--shadow-float)`；开合与真源/导出菜单共用 160ms opacity/scale（`translateX(6px) scale(0.98)` → none）；层级缩进；当前项天蓝字；桌面悬停展开、移出 **350ms** 宽限收起（指针仍在 TOC 内时不因点击章节失焦而关）；触控 / `pointer: coarse` 点按隐喻 TOC 展开、点外侧收起；`prefers-reduced-motion` 关闭过渡 |
| 跳转 | 条目为 `a[href="#sectionId"]`；滚动偏移对齐 sticky 顶栏（`html` 上 `scroll-padding-top`） |
| 文案 | `aria-label` 走 html-locale `components.page-toc.label` |
| 客户端 | `page-toc-script`：水平对齐 `main` gutter、滚动高亮当前项；幂等 `data-page-toc-initialized` |

### 其它常用根

| type | 根形态（摘要） |
|------|----------------|
| `hero` | `<section>` 圆角表面卡 + chrome + metrics 栅格；metrics 按手机 1 列、平板 2 列、宽屏 4 列渐进；value 行与 `collection.metric` 共用 `emitMetricValueRow`（tone/status 色彩）；**不**挂协议 `id` 到 HTML |
| `lead` | 左天蓝条 `border-l-4` 表面块；正文直接挂根上 |
| `group` | 圆角边框容器；标题为 mono 大写 chrome（非 heading 层级） |
| `heading` | `div.space-y-2` 包对应 `h1`–`h6` 字阶 |
| `paragraph` | 根即 `<p>` |
| `callout` / `blockquote` / 列表 | 根即带 utility 的可视框（callout 不套多余 aside；variant 仅 `data-variant`） |
| `collection` | 按 `variant`：`metric` 度量卡；`chip` 徽标行；`panel` 嵌套块；`compact`/`card`/`stat` 各形态表面卡；卡片按手机 1 列、平板 2 列、宽屏 3 列渐进；`metric` value 与 `hero` metrics 共用 tone/status 色彩与 value 行 helper |
| `keyValueList` | 按 `layout`：`inline` / `stacked` 均为 flex 换行，**每行最多 3 项且等宽均分**（`flex-1` + ~1/3 basis）；`auto` 少条目紧凑行 / 多条目回落 stacked |
| `fileTree` | 圆角边框 mono 卡：chrome（folders 图标 + caption/根名）+ 缩进行（目录/文件图标、`change` 徽标或 annotation） |
| `fileChangeList` | 四列表格：路径 / 变更徽标 / 说明 / 尺寸差量 |
| `apiInventory` | 圆角分隔列表行：方法色标 + path + summary + status 徽标 |
| `linkList` | 圆角分隔外链行：天蓝标签 + `external-link` 图标 + 次要描述 |
| `citation` | 引用条：`[id]` 色标 + source + 行内 `(locator)` |
| `image` | 圆角表面 `figure` 卡：居中图 + 次要 `figcaption` |
| `embed` | 可点外链卡：站点标（GitHub→`github`，否则 `book-open`）+ 标题/URL + 尾部 `external-link` |
| `tabs` | 圆角边框壳；横向可滚动 tablist + 单一可见 panel；tab 按钮 `cursor-pointer` + hover 底色/字色反馈；首项 SSR 选中，客户端支持点击与 ArrowLeft / ArrowRight / Home / End 键切换；`airp-tabs:{route}:{instance}` 保存非首项选择，选回首项则 `removeItem`；**1.1.0** 的 instance / panel 值分别用 tabs / panel 的 `@id`，**1.0.0** 用文档序 `tabs-N` / `panel-N`；panel 内积木仍走各自 emit |
| `collapsible` | `<details class="group">`；`summary` 前置 `chevron-down`（`group-open:rotate-180`），`cursor-pointer` + hover 底色/字色反馈；`defaultOpen` 时根节点带 `open`；`data-default-open` + `data-storage-key`（`airp-collapsible:{route}:{instance}`）。客户端：有偏好且 ≠ `defaultOpen` 时覆盖；相等则 `removeItem`。`instance`：**1.1.0** 用 `@id`，**1.0.0** 用文档序 `collapsible-N` |
| `agentNote` | 仅 `visible === true` 输出；天蓝提示卡 + `info` 图标底座 + 本地化标题，不显示 `visible` 布尔原文 |
| `appendix` | 圆角表面卡；header 仅显示标题，不追加 `Appendix` 徽标 |
| Status | 单一 helper → `.status-badge` + `data-status={Status}`（着色只认 `data-status`） |
| Accent | 无 Status 的天蓝徽标 → `renderAccentBadge` + `data-tone` |

## `.svg-viewer`

顶栏 chrome（可选图题 + 放大/缩小/复原；缩放按钮 `cursor-pointer` + hover 底色/字色反馈）→ 点阵视口 pan/zoom → 底边拖高；`data-svg-viewer-*`；触摸手势保留页面纵向滚动与浏览器缩放，触摸端用按钮缩放；图标雪碧图；产物无 Mermaid 运行时。见 `registry://rules.renderer.rules.mermaid-svg`。

### `mermaid` / `architectureOverview`

| type | 终态 |
|------|------|
| `mermaid` | 根挂 `data-mermaid`；内嵌 `.svg-viewer`（`title` 进 chrome，无 `figcaption`） |
| `architectureOverview` | 上：overview Mermaid 同壳；下：三列模块卡（标题 + status/badge、描述、meta 键值脚） |

## 代码 / 差分

| type | 终态 |
|------|------|
| `code` | 文件名/语言 chrome + `data-code-copy`；Shiki SSR；行号 |
| `codeDiff`（`unified`） | 文件名 + 语言徽标 + +/- 统计；单栏增删着色（`data-code-diff="unified"`） |
| `codeDiff`（`before`/`after`） | 文件名 + 语言徽标；`sm:grid-cols-2` 双栏；`diff` 行级对比 + `+/-` 着色（`data-code-diff="split"`） |

语言白名单失败 → `text`。白名单：`text`, `diff`, `typescript`, `javascript`, `tsx`, `jsx`, `html`, `css`, `scss`, `json`, `jsonc`, `go`, `rust`, `c`, `cpp`, `csharp`, `java`, `kotlin`, `python`, `ruby`, `php`, `lua`, `shellscript`, `powershell`, `yaml`, `toml`, `xml`, `graphql`, `sql`, `protobuf`, `markdown`, `mdx`, `vue`, `svelte`, `dockerfile`, `terraform`, `nginx`, `makefile`, `swift`, `scala`, `dart`, `ini`。

## 客户端

`buildHtmlClientScript`：亮暗色、svg-viewer、collapsible 开合偏好、tabs、真源参考浮层、代码复制、文档本地时间、本页目录滚动高亮。禁止 `window.basecoat`。

亮暗色：`localStorage` 为契约表面；文档事件 `airp-color-scheme`（`detail`: `"light"` \| `"dark"`）由客户端脚本统一 `apply`（写 storage、`html.dark`、切换按钮）。

localStorage 键：

| Key | 说明 |
|-----|------|
| `airp-app-color-scheme` | 仅存 `"dark"`；回到 `light`（默认）时 `removeItem` |
| `airp-svg-viewer:{route}:{instance}` | 图 pan/zoom/高度；见 `mermaid-svg` |
| `airp-collapsible:{route}:{instance}` | 折叠开合；与 `defaultOpen` 相同时 `removeItem` |
| `airp-tabs:{route}:{instance}` | 当前 panel；选中首项（默认）时 `removeItem` |

## 禁止

- Basecoat；未限定根的 document 裸委托；兼容双属性
- 向读者输出 kind / type 名 / importance / 布尔原文 / **协议 `block.id` 文本**（锚点 `id` 属性除外）
- CDN / 浏览器内着色运行时
- 将非 `section` 块或文档头 `h1` 列入本页目录

## 维护

改钩子或壳层身份契约时同步本文与实现。
