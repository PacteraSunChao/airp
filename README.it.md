# AIRP — AI Report Protocol

[🇺🇸 English](./README.md) | [🇨🇳 中文](./README.cn.md) | [🇯🇵 日本語](./README.ja.md) | [🇰🇷 한국어](./README.ko.md) | [🇩🇪 Deutsch](./README.de.md) | [🇫🇷 Français](./README.fr.md) | [🇷🇺 Русский](./README.ru.md) | [🇪🇸 Español](./README.es.md) | [🇧🇷 Português (Brasil)](./README.pt-BR.md) | [🇮🇹 Italiano](./README.it.md)

![AIRP screen capture](./screen-capture.png "AIRP screen capture")

**Rendere i report scritti dall’IA più leggibili—e più facili da modificare.**

Chiedi Markdown all’IA e spesso esce piatto e disordinato. L’HTML sta meglio, ma è lungo, mangia token e poi è una seccatura da ritoccare. L’approccio di AIRP: far scrivere prima una sorgente `*.airp.json`, aprirla con l’estensione **AIRP Renderer** come HTML ordinato. Per condividere, esporti HTML o Markdown.

La sorgente è organizzata come i **blocchi (Blocks)** di Notion—oggi ne abbiamo **46** (metriche hero, confronto, decisione, timeline, Mermaid, overview di architettura, ecc.). Ognuno ha il proprio layout: piani, review, retro e audit restano chiari, senza diventare un muro di testo.

## Come gira un report

Scrivere e leggere restano separati. Il `*.airp.json` in mezzo è vincolato da JSON Schema: generazione e validazione partono da lì:

| Chi | Cosa fa |
| --- | --- |
| **Skill `/airp`** | Fa creare o aggiornare la sorgente all’IA e la valida |
| **Estensione VS Code** | Leggere nell’editor; esportare HTML / Markdown |

Cosa ottieni davvero:

- Campi o sezioni mancanti → la validazione fallisce; meno consegne a metà.
- La sorgente sta bene in Git e nei diff; HTML / Markdown sono solo ciò che leggono le persone.
- Confini di blocco chiari stabilizzano il modello e di solito costano meno token di una pagina HTML scritta a mano.

## Avvio rapido

### 1. Installa l’estensione VS Code

Installa **AIRP Renderer** dal [Marketplace](https://marketplace.visualstudio.com/items?itemName=airp.airp-renderer-vscode) (ID: `airp.airp-renderer-vscode`).

Apri qualsiasi `*.airp.json` per leggerlo, oppure esporta HTML / Markdown. Serve un editor compatibile con VS Code (es. Cursor).

### 2. Installa lo Skill `/airp`

Se apri solo sorgenti già scritte da altri, basta l’estensione. Installa lo Skill quando vuoi che l’IA scriva report nuovi:

```bash
npx skills add maosong-ai/airp
```

In chat digita `/airp <argomento>`. Lo Skill genera e valida una sorgente (cartella predefinita: `.docs/airp/`). Poi aprila con l’estensione per leggere. Opzionale: `--locale it-IT`, `--out <directory>`.

## Lingue

Lingue documento supportate: English (`en-US`), 简体中文 (`zh-CN`), 日本語 (`ja-JP`), 한국어 (`ko-KR`), Deutsch (`de-DE`), Français (`fr-FR`), Русский (`ru-RU`), Español (`es-ES`), Português Brasil (`pt-BR`), Italiano (`it-IT`). In scrittura indica `/airp --locale …`.

## Cosa viene dopo

Già disponibile: Skill genera / valida le sorgenti; l’estensione legge ed esporta HTML / Markdown. In coda:

| Direzione | In breve |
| --- | --- |
| **Editing visuale** | Modificare nell’estensione, senza passare dallo Skill a ogni ritocco |
| **Più formati di export** | Aggiungere PDF (stampa, archivio) |
| **Più pagine / più sheet** | Spezzare i report lunghi per sezione o foglio, non ammucchiare tutto in una pagina |

## Sviluppo locale e build

Per chi mette mano al repository. Nell’uso quotidiano bastano estensione VS Code e Skill—non serve clonare questo repo.

Ambiente: Node.js **20.19+**, pnpm **10.17+**.

```bash
pnpm install
```

**CLI di validazione** (`airp-validate`)

```bash
# provalo
pnpm validate-cli:sample

# build → apps/validate-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/validate-cli
```

**CLI di render** (`airp-render`)

```bash
# provalo
pnpm renderer-cli:sample

# build → apps/renderer-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/renderer-cli
```

**Estensione VS Code**

Apri questo repo in VS Code, F5 (o **Launch AIRP Renderer**) per fare debug nell’Extension Development Host.

```bash
# build
pnpm exec turbo run build --filter=airp-renderer-vscode

# pacchetto → apps/renderer-vscode/dist/airp-renderer-vscode-<version>.vsix
pnpm --filter=airp-renderer-vscode package
```

---

## Licenza

MIT

[AIRP](https://github.com/maosong-ai/airp) | Copyright (c) 2026 毛松 <maosong-life@outlook.com>
