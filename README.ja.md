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

## ブロック

これらを覚える必要はありません。`/airp` Skill が内容に合わせて自分で選びます。カスタマイズしたいときだけ、下の表を見てください。

| 体裁と本文 | 対照と一覧 | エンジニアリングと意思決定 |
| --- | --- | --- |
| **指標ヒーロー**(`hero`)<br>*冒頭に、いちばん大事な指標を数個* | **表**(`table`)<br>*行と列を揃えて見比べる* | **コード**(`code`)<br>*短いコードを置く* |
| **リード**(`lead`)<br>*この節が何の話か、一文で* | **比較**(`comparison`)<br>*左右で変更前と変更後* | **差分**(`codeDiff`)<br>*どの行が変わったか* |
| **セクション**(`section`)<br>*テーマごとに、飛べる大きな塊* | **カード集**(`collection`)<br>*項目をカードで並べる* | **ファイルツリー**(`fileTree`)<br>*ディレクトリ構成を見せる* |
| **見出し**(`heading`)<br>*小節の階層を示す* | **キーバリュー**(`keyValueList`)<br>*名前と値を対で* | **ファイル変更**(`fileChangeList`)<br>*追加・変更・削除したファイル* |
| **段落**(`paragraph`)<br>*説明を一段落* | **定義リスト**(`definitionList`)<br>*用語と意味を対で* | **Mermaid**(`mermaid`)<br>*フロー、シーケンス、状態などの図* |
| **グループ**(`group`)<br>*隣り合う内容をひとつにまとめる* | **用語集**(`glossary`)<br>*文中の用語をまとめて説明* | **アーキテクチャ概要**(`architectureOverview`)<br>*全体図とモジュールカードでシステムを見る* |
| **プルクオート**(`pullQuote`)<br>*大事な一文だけを抜き出す* | **ステータスボード**(`statusBoard`)<br>*合格・不合格・一部を一目で* | **API 一覧**(`apiInventory`)<br>*API と用途を列挙* |
| **引用**(`blockquote`)<br>*原文や他人の言葉を引く* | **チェックリスト**(`checklist`)<br>*項目が済んだかチェック* | **テスト結果**(`testResult`)<br>*成功数と失敗数をまとめる* |
| **コールアウト**(`callout`)<br>*注意・警告・結論を目立たせる* | **タイムライン**(`timeline`)<br>*起きたことを時間順に* | **要件トレース**(`requirementTrace`)<br>*要件を状態と根拠に結びつける* |
| **箇条書き**(`bulletList`)<br>*要点を並べる* | **ロードマップ**(`roadmap`)<br>*段階ごとの目標と進捗* | **意思決定**(`decision`)<br>*何を選び、なぜかを残す* |
| **番号リスト**(`numberedList`)<br>*手順や項目を順番に* | **ステップ**(`flowSteps`)<br>*流れを前後の手順に分ける* | **リスク**(`risk`)<br>*リスクと今の扱い* |
| **区切り線**(`divider`)<br>*上下のあいだに線を引く* | **リンクリスト**(`linkList`)<br>*関連リンクを並べる* | **前提**(`assumption`)<br>*今たよっている前提* |
| **余白**(`spacer`)<br>*ブロックのあいだに空きを入れる* | **出典**(`citation`)<br>*引用元を示す* | **制約**(`constraint`)<br>*破ってはいけない制限* |
| **画像**(`image`)<br>*図を入れて説明を添える* | **タブ**(`tabs`)<br>*同じ場所で見方を切り替える* | **未決の問い**(`openQuestion`)<br>*まだ決まっていないこと* |
| **埋め込み**(`embed`)<br>*外部ページやリソースを埋め込む* | **折りたたみ**(`collapsible`)<br>*副次的な長い内容を畳む* | **エージェントメモ**(`agentNote`)<br>*モデル向けのメモ。人には既定で出さない* |
| **付録**(`appendix`)<br>*補足は文末へ* | | |

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

## 変更履歴

[変更履歴](https://github.com/maosong-ai/airp/blob/main/CHANGELOG.md)

## ライセンス

MIT

[AIRP](https://github.com/maosong-ai/airp) | Copyright (c) 2026 毛松 <maosong-life@outlook.com>
