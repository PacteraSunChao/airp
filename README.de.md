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

## Blöcke

Die musst du dir nicht merken. Der `/airp` Skill wählt sie nach dem Inhalt; die Tabelle brauchst du nur zum Anpassen.

| Layout und Text | Vergleich und Listen | Technik und Entscheidungen |
| --- | --- | --- |
| **Hero**(`hero`)<br>*Die wenigen Kennzahlen, die ganz vorn zählen* | **Tabelle**(`table`)<br>*Zeilen und Spalten zum Vergleichen* | **Code**(`code`)<br>*Ein kurzes Snippet* |
| **Lead**(`lead`)<br>*Ein Satz, worum es hier geht* | **Vergleich**(`comparison`)<br>*Vorher und nachher, nebeneinander* | **Code-Diff**(`codeDiff`)<br>*Welche Zeilen sich geändert haben* |
| **Abschnitt**(`section`)<br>*Ein großes Thema, zu dem man springen kann* | **Sammlung**(`collection`)<br>*Einträge als Karten* | **Dateibaum**(`fileTree`)<br>*Eine Verzeichnisstruktur* |
| **Überschrift**(`heading`)<br>*Markiert die Ebene eines Unterabschnitts* | **Schlüssel-Wert-Liste**(`keyValueList`)<br>*Namen mit Werten gepaart* | **Dateiänderungen**(`fileChangeList`)<br>*Hinzugefügte, geänderte, gelöschte Dateien* |
| **Absatz**(`paragraph`)<br>*Ein Stück Erklärung* | **Definitionsliste**(`definitionList`)<br>*Begriffe mit Bedeutungen gepaart* | **Mermaid**(`mermaid`)<br>*Ablauf, Sequenz, Zustand und ähnliche Diagramme* |
| **Gruppe**(`group`)<br>*Bündelt benachbarten Inhalt* | **Glossar**(`glossary`)<br>*Begriffe aus dem Text an einem Ort* | **Architekturüberblick**(`architectureOverview`)<br>*Systemdiagramm plus Modulkarten* |
| **Pull-Quote**(`pullQuote`)<br>*Hebt einen Schlüsselsatz heraus* | **Statusboard**(`statusBoard`)<br>*Bestanden, fehlgeschlagen oder teilweise auf einen Blick* | **API-Liste**(`apiInventory`)<br>*Endpunkte und wofür sie da sind* |
| **Zitat**(`blockquote`)<br>*Zitiert eine Passage oder jemand anderen* | **Checkliste**(`checklist`)<br>*Punkte zum Abhaken* | **Testergebnis**(`testResult`)<br>*Anzahl bestanden und fehlgeschlagen* |
| **Hinweis**(`callout`)<br>*Markiert Hinweis, Warnung oder Fazit* | **Timeline**(`timeline`)<br>*Was passiert ist, in der Zeit* | **Anforderungsspur**(`requirementTrace`)<br>*Anforderungen mit Status und Beleg* |
| **Aufzählung**(`bulletList`)<br>*Punkte nebeneinander* | **Roadmap**(`roadmap`)<br>*Ziele und Stand nach Phase* | **Entscheidung**(`decision`)<br>*Was gewählt wurde, und warum* |
| **Nummerierte Liste**(`numberedList`)<br>*Schritte oder Einträge der Reihe nach* | **Ablaufschritte**(`flowSteps`)<br>*Ein Ablauf in Schritten* | **Risiko**(`risk`)<br>*Ein Risiko und wo es steht* |
| **Trennlinie**(`divider`)<br>*Eine Linie zwischen oben und unten* | **Linkliste**(`linkList`)<br>*Zugehörige Links* | **Annahme**(`assumption`)<br>*Eine Prämisse, auf der der Bericht ruht* |
| **Abstand**(`spacer`)<br>*Leerraum zwischen Blöcken* | **Quellenangabe**(`citation`)<br>*Woher eine Aussage kommt* | **Randbedingung**(`constraint`)<br>*Eine Grenze, die nicht bricht* |
| **Bild**(`image`)<br>*Ein Bild mit Bildunterschrift* | **Tabs**(`tabs`)<br>*Mehrere Sichten an einer Stelle* | **Offene Frage**(`openQuestion`)<br>*Etwas, das noch offen ist* |
| **Einbettung**(`embed`)<br>*Eine externe Seite oder Ressource* | **Klappblock**(`collapsible`)<br>*Langen, nebensächlichen Inhalt einklappen* | **Agentennotiz**(`agentNote`)<br>*Eine Notiz fürs Modell; für Leser standardmäßig ausgeblendet* |
| **Anhang**(`appendix`)<br>*Zusatzmaterial ans Ende* | | |

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
