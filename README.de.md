# AIRP — AI Report Protocol

[🇺🇸 English](./README.md) | [🇨🇳 中文](./README.cn.md) | [🇯🇵 日本語](./README.ja.md) | [🇰🇷 한국어](./README.ko.md) | [🇩🇪 Deutsch](./README.de.md) | [🇫🇷 Français](./README.fr.md) | [🇷🇺 Русский](./README.ru.md) | [🇪🇸 Español](./README.es.md) | [🇧🇷 Português (Brasil)](./README.pt-BR.md) | [🇮🇹 Italiano](./README.it.md)

![AIRP screen capture](./screen-capture.png "AIRP screen capture")

**Berichte von der KI besser lesbar machen—und leichter änderbar.**

Lass die KI Markdown schreiben, und oft wird’s flach und zerfahren. HTML sieht besser aus, ist aber lang, frisst Tokens und lässt sich später schlecht anfassen. AIRPs Ansatz: Die KI schreibt zuerst eine `*.airp.json`-Quelle, du öffnest sie mit der **AIRP-Renderer**-Erweiterung als ordentliches HTML. Zum Weitergeben exportierst du HTML oder Markdown.

Die Quelle ist wie Notion in **Blöcken (Blocks)** organisiert—aktuell **46** Stück (Hero-Metriken, Vergleich, Entscheidung, Timeline, Mermaid, Architekturüberblick usw.). Jeder Block hat sein eigenes Layout. Pläne, Reviews, Retros und Audits wirken klarer und werden keine Textwand.

## So läuft ein Bericht

Schreiben und Lesen bleiben getrennt. Die `*.airp.json` in der Mitte folgt JSON Schema—Erzeugung und Validierung nehmen sie als Wahrheit:

| Wer | Was es tut |
| --- | --- |
| **`/airp` Skill** | KI lässt die Quelle erzeugen oder ändern und validiert sie |
| **VS-Code-Erweiterung** | Im Editor lesen; HTML / Markdown exportieren |

Was das konkret bringt:

- Fehlende Felder oder Abschnitte scheitern an der Validierung—weniger halbfertige Ablieferungen.
- Die Quelle passt zu Git und Diffs; HTML / Markdown sind nur das, was Menschen lesen.
- Klare Blockgrenzen machen das Modell stabiler und brauchen meist weniger Tokens als eine handgeschriebene HTML-Seite.

## Schnellstart

### 1. VS-Code-Erweiterung installieren

**AIRP Renderer** aus dem [Marketplace](https://marketplace.visualstudio.com/items?itemName=airp.airp-renderer-vscode) installieren (Erweiterungs-ID: `airp.airp-renderer-vscode`).

Beliebige `*.airp.json` öffnen zum Lesen—oder HTML / Markdown exportieren. Braucht einen VS-Code-kompatiblen Editor (z. B. Cursor).

### 2. `/airp` Skill installieren

Nur vorhandene Quellen lesen? Die Erweiterung reicht. Den Skill brauchst du, wenn die KI neue Berichte schreiben soll:

```bash
npx skills add maosong-ai/airp
```

Im Chat `/airp <Thema>` eingeben. Der Skill erzeugt und validiert eine Quelle (Standardordner: `.docs/airp/`). Danach mit der Erweiterung öffnen und lesen. Optional: `--locale de-DE`, `--out <Verzeichnis>`.

## Sprachen

Unterstützte Dokumentsprachen: English (`en-US`), 简体中文 (`zh-CN`), 日本語 (`ja-JP`), 한국어 (`ko-KR`), Deutsch (`de-DE`), Français (`fr-FR`), Русский (`ru-RU`), Español (`es-ES`), Português Brasil (`pt-BR`), Italiano (`it-IT`). Beim Schreiben mit `/airp --locale …` wählen.

## Was als Nächstes kommt

Heute schon da: Skill erzeugt / validiert Quellen; Erweiterung liest und exportiert HTML / Markdown. Geplant:

| Richtung | Kurz |
| --- | --- |
| **Visuelles Bearbeiten** | Inhalt in der Erweiterung ändern—nicht für jede Änderung den Skill bemühen |
| **Mehr Exportformate** | PDF dazu (Druck, Archiv) |
| **Mehrseitig / Mehrblatt** | Lange Berichte nach Abschnitt oder Blatt teilen, nicht alles auf eine Seite |

## Lokale Entwicklung und Build

Für Leute, die am Repo mitarbeiten. Für den Alltag mit VS-Code-Erweiterung und Skill musst du dieses Repo nicht klonen.

Umgebung: Node.js **20.19+**, pnpm **10.17+**.

```bash
pnpm install
```

**Validate-CLI** (`airp-validate`)

```bash
# ausprobieren
pnpm validate-cli:sample

# Build → apps/validate-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/validate-cli
```

**Render-CLI** (`airp-render`)

```bash
# ausprobieren
pnpm renderer-cli:sample

# Build → apps/renderer-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/renderer-cli
```

**VS-Code-Erweiterung**

Repo in VS Code öffnen, F5 (oder **Launch AIRP Renderer**) für den Extension Development Host.

```bash
# Build
pnpm exec turbo run build --filter=airp-renderer-vscode

# Paket → apps/renderer-vscode/dist/airp-renderer-vscode-<version>.vsix
pnpm --filter=airp-renderer-vscode package
```

---

## Lizenz

MIT

[AIRP](https://github.com/maosong-ai/airp) | Copyright (c) 2026 毛松 <maosong-life@outlook.com>
