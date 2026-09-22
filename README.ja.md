# AIRP — AI Report Protocol（AI レポートプロトコル）

[🇺🇸 English](./README.md) | [🇨🇳 中文](./README.cn.md) | [🇯🇵 日本語](./README.ja.md) | [🇰🇷 한국어](./README.ko.md) | [🇩🇪 Deutsch](./README.de.md) | [🇫🇷 Français](./README.fr.md) | [🇷🇺 Русский](./README.ru.md) | [🇪🇸 Español](./README.es.md) | [🇧🇷 Português (Brasil)](./README.pt-BR.md) | [🇮🇹 Italiano](./README.it.md)

![AIRP screen capture](./screen-capture.png "AIRP screen capture")

**AI が書いたレポートを、読みやすく、直しやすくする。**

AI に Markdown を書かせると、平坦で散漫になりがち。HTML なら見た目は整うけど、長くて token も食うし、あとから直すのも大変。AIRP のやり方はこうです。まず AI に `*.airp.json` のソースを書かせ、**AIRP Renderer** 拡張で整った HTML として開く。外に出すときは HTML か Markdown をエクスポートすればいい。

ソースは Notion の **ブロック（Block）** の考え方でまとめていて、いま **46** 種類あります（指標ヒーロー、比較、意思決定、タイムライン、Mermaid、アーキテクチャ概要など）。それぞれ専用のレイアウトがあるので、計画・レビュー・振り返り・監査といったレポートがはっきりし、「文字の塊」になりにくいです。

## レポートはどう動くか

書くことと読むことは分けています。あいだの `*.airp.json` は JSON Schema で形が決まっていて、生成も検証もここを正とします：

| 誰 | 何をするか |
| --- | --- |
| **`/airp` Skill** | AI にソースを作らせたり直させたりし、検証する |
| **VS Code 拡張** | エディタで読む；HTML / Markdown をエクスポート |

実際にうれしいところ：

- フィールドや章が欠けていると検証で落ちるので、中途半端な納品が減る。
- ソースは Git や diff 向き；HTML / Markdown は人が読むための成果物。
- ブロックの境目がはっきりしているのでモデルも安定しやすく、手書きの長い HTML より token も抑えめになりやすい。

## クイックスタート

### 1. VS Code 拡張を入れる

[Marketplace](https://marketplace.visualstudio.com/items?itemName=airp.airp-renderer-vscode) から **AIRP Renderer** をインストール（拡張 ID：`airp.airp-renderer-vscode`）。

`*.airp.json` を開けば読めます。HTML / Markdown のエクスポートもできます。VS Code 互換エディタが必要です（例：Cursor）。

### 2. `/airp` Skill を入れる

すでに書かれたソースを読むだけなら、拡張だけで十分です。AI に新しいレポートを書かせたいときだけ Skill を入れてください：

```bash
npx skills add maosong-ai/airp
```

チャットで `/airp <トピック>` と入力。Skill がソースを生成・検証します（既定フォルダ：`.docs/airp/`）。あとは拡張で開いて読めば OK。任意：`--locale ja-JP`、`--out <ディレクトリ>`。

## 多言語

対応しているドキュメント言語：English（`en-US`）、简体中文（`zh-CN`）、日本語（`ja-JP`）、한국어（`ko-KR`）、Deutsch（`de-DE`）、Français（`fr-FR`）、Русский（`ru-RU`）、Español（`es-ES`）、Português Brasil（`pt-BR`）、Italiano（`it-IT`）。レポート作成時は `/airp --locale …` で指定します。

## これからやること

いま使えること：Skill でソースの生成 / 検証、拡張で HTML / Markdown の閲覧とエクスポート。次に予定していること：

| 方向 | 内容 |
| --- | --- |
| **ビジュアル編集** | 拡張の中で直接直す。毎回 Skill に頼らなくていい |
| **エクスポート形式を増やす** | PDF（印刷・保管）を追加 |
| **複数ページ / 複数シート** | 長いレポートを章やシートで分け、1 ページに詰め込まない |

## ローカル開発とビルド

リポジトリを触る人向けです。普段 VS Code 拡張と Skill だけ使うなら、このリポジトリをクローンする必要はありません。

環境：Node.js **20.19+**、pnpm **10.17+**。

```bash
pnpm install
```

**検証 CLI**（`airp-validate`）

```bash
# 試す
pnpm validate-cli:sample

# ビルド → apps/validate-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/validate-cli
```

**レンダー CLI**（`airp-render`）

```bash
# 試す
pnpm renderer-cli:sample

# ビルド → apps/renderer-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/renderer-cli
```

**VS Code 拡張**

このリポジトリを VS Code で開き、F5（または **Launch AIRP Renderer**）で Extension Development Host に入ればデバッグできます。

```bash
# ビルド
pnpm exec turbo run build --filter=airp-renderer-vscode

# パッケージ → apps/renderer-vscode/dist/airp-renderer-vscode-<version>.vsix
pnpm --filter=airp-renderer-vscode package
```

---

## ライセンス

MIT

[AIRP](https://github.com/maosong-ai/airp) | Copyright (c) 2026 毛松 <maosong-life@outlook.com>
