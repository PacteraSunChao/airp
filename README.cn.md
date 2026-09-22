# AIRP — AI Report Protocol（AI 报告协议）

[🇺🇸 English](./README.md) | [🇨🇳 中文](./README.cn.md) | [🇯🇵 日本語](./README.ja.md) | [🇰🇷 한국어](./README.ko.md) | [🇩🇪 Deutsch](./README.de.md) | [🇫🇷 Français](./README.fr.md) | [🇷🇺 Русский](./README.ru.md) | [🇪🇸 Español](./README.es.md) | [🇧🇷 Português (Brasil)](./README.pt-BR.md) | [🇮🇹 Italiano](./README.it.md)

![AIRP screen capture](./screen-capture.png "AIRP screen capture")

**让 AI 写出来的报告更好读，也好改。**

AI 直接出 Markdown，往往又平又散；直接出 HTML，版式好看，但又长又费 token，后面也不好改。AIRP 的做法是：先让 AI 写出一份 `*.airp.json` 源文件，再用 **AIRP Renderer** 扩展打开成排版好的 HTML；需要对外发时，再导出 HTML 或 Markdown。

源文件按 Notion 那套 **积木块（Block）** 组织，目前有 **46** 种——指标首屏、对比、决策、时间线、Mermaid、架构总览等。每种有自己的版式，方案、评审、复盘、审计这类报告会清楚很多，不会糊成一坨字。

## 报告是怎么跑起来的

写和读是分开的。中间那份 `*.airp.json` 由 JSON Schema 约束，生成和校验都以它为准：

| 谁 | 干什么 |
| --- | --- |
| **`/airp` Skill** | 让 AI 生成或改源文件，并做校验 |
| **VS Code 扩展** | 在编辑器里阅读；导出 HTML / Markdown |

这样做的实际好处：

- 缺字段、缺章节时校验会失败，少交半成品。
- 源文件适合进 Git、做 diff；HTML / Markdown 只当给人看的成品。
- 积木块边界清楚，对模型更稳，通常也比整页手写 HTML 更省 token。

## 快速开始

### 1. 安装 VS Code 扩展

到 [Marketplace](https://marketplace.visualstudio.com/items?itemName=airp.airp-renderer-vscode) 安装 **AIRP Renderer**（扩展 ID：`airp.airp-renderer-vscode`）。

打开任意 `*.airp.json` 就能读，也可以导出 HTML / Markdown。需要 VS Code 兼容编辑器（如：Cursor）。

### 2. 安装 `/airp` Skill

只读别人已经写好的源文件，装扩展就够了。要让 AI 帮你写新报告时，再装 Skill：

```bash
npx skills add maosong-ai/airp
```

对话里输入 `/airp <主题>`，Skill 会生成并校验源文件（默认目录：`.docs/airp/`），再用扩展打开即可阅读。可选参数：`--locale zh-CN`、`--out <目录>`。

## 多语言

支持这些文档语言：English（`en-US`）、简体中文（`zh-CN`）、日本語（`ja-JP`）、한국어（`ko-KR`）、Deutsch（`de-DE`）、Français（`fr-FR`）、Русский（`ru-RU`）、Español（`es-ES`）、Português Brasil（`pt-BR`）、Italiano（`it-IT`）。写报告时用 `/airp --locale …` 指定。

## 接下来打算做什么

现在已经能用：Skill 生成 / 校验源文件，扩展阅读并导出 HTML / Markdown。后面计划：

| 方向 | 说明 |
| --- | --- |
| **可视化编辑** | 在扩展里直接改内容，不必事事找 Skill |
| **更多导出格式** | 增加 PDF（打印、归档） |
| **多页 / 多 Sheet** | 长报告按章节或工作表拆开，别堆成一页 |

## 本地开发与构建

给参与开发的人看的。平时只用 VS Code 扩展和 Skill即可，不用克隆这个仓库。

环境：Node.js **20.19+**、pnpm **10.17+**。

```bash
pnpm install
```

**校验 CLI**（`airp-validate`）

```bash
// 调试
pnpm validate-cli:sample

// 编译产物：`apps/validate-cli/dist/cli.mjs`
pnpm exec turbo run build --filter=@airp/validate-cli
```

**渲染 CLI**（`airp-render`）

```bash
// 调试
pnpm renderer-cli:sample

// 编译产物：`apps/renderer-cli/dist/cli.mjs`
pnpm exec turbo run build --filter=@airp/renderer-cli
```

**VS Code 扩展**

用 VS Code 打开本仓库，按 F5（或运行 **Launch AIRP Renderer**）进入 Extension Development Host 即可调试。

```bash
// 编译
pnpm exec turbo run build --filter=airp-renderer-vscode

// 打包产物：`apps/renderer-vscode/dist/airp-renderer-vscode-<version>.vsix`
pnpm --filter=airp-renderer-vscode package
```

---

## 许可证

MIT

[AIRP](https://github.com/maosong-ai/airp) | Copyright (c) 2026 毛松 <maosong-life@outlook.com>
