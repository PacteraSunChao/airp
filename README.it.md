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

## Blocchi

Non serve memorizzarli. Lo Skill `/airp` li sceglie in base al contenuto; la tabella serve quando vuoi personalizzare.

| Impaginazione e testo | Confronto e liste | Ingegneria e decisioni |
| --- | --- | --- |
| **Hero**(`hero`)<br>*Le poche metriche che contano, in apertura* | **Tabella**(`table`)<br>*Righe e colonne allineate per confrontare* | **Codice**(`code`)<br>*Un frammento breve* |
| **Lead**(`lead`)<br>*Una frase su cosa racconta questa parte* | **Confronto**(`comparison`)<br>*Prima e dopo, affiancati* | **Diff di codice**(`codeDiff`)<br>*Quali righe sono cambiate* |
| **Sezione**(`section`)<br>*Un tema grande a cui si può saltare* | **Raccolta**(`collection`)<br>*Voci a schede* | **Albero dei file**(`fileTree`)<br>*La struttura delle cartelle* |
| **Titolo**(`heading`)<br>*Segna il livello di una sottosezione* | **Lista chiave-valore**(`keyValueList`)<br>*Nomi accoppiati ai valori* | **Modifiche ai file**(`fileChangeList`)<br>*File aggiunti, modificati o eliminati* |
| **Paragrafo**(`paragraph`)<br>*Un pezzo di spiegazione* | **Lista di definizioni**(`definitionList`)<br>*Termini accoppiati al significato* | **Mermaid**(`mermaid`)<br>*Flusso, sequenza, stato e diagrammi simili* |
| **Gruppo**(`group`)<br>*Raduna il contenuto vicino* | **Glossario**(`glossary`)<br>*I termini del testo, in un solo posto* | **Overview di architettura**(`architectureOverview`)<br>*Schema del sistema più schede dei moduli* |
| **Citazione in evidenza**(`pullQuote`)<br>*Tira fuori da sola una frase chiave* | **Bacheca di stato**(`statusBoard`)<br>*Superato, fallito o parziale a colpo d’occhio* | **Inventario API**(`apiInventory`)<br>*Endpoint e a cosa servono* |
| **Citazione**(`blockquote`)<br>*Cita un passaggio o qualcun altro* | **Checklist**(`checklist`)<br>*Voci da spuntare* | **Risultati dei test**(`testResult`)<br>*Conteggi di superati e falliti* |
| **Richiamo**(`callout`)<br>*Segnala una nota, un avviso o una conclusione* | **Timeline**(`timeline`)<br>*Cos’è successo, in ordine di tempo* | **Tracciamento requisiti**(`requirementTrace`)<br>*Requisiti legati a stato e prove* |
| **Elenco puntato**(`bulletList`)<br>*Punti affiancati* | **Roadmap**(`roadmap`)<br>*Obiettivi e avanzamento per fase* | **Decisione**(`decision`)<br>*Cosa è stato scelto e perché* |
| **Elenco numerato**(`numberedList`)<br>*Passi o voci in ordine* | **Passi di flusso**(`flowSteps`)<br>*Un processo spezzato in passi* | **Rischio**(`risk`)<br>*Un rischio e a che punto è* |
| **Separatore**(`divider`)<br>*Una linea tra sopra e sotto* | **Lista di link**(`linkList`)<br>*Link correlati* | **Assunzione**(`assumption`)<br>*Una premessa da cui dipende il report* |
| **Spazio**(`spacer`)<br>*Vuoto tra i blocchi* | **Fonte**(`citation`)<br>*Da dove arriva una citazione* | **Vincolo**(`constraint`)<br>*Un limite che non si supera* |
| **Immagine**(`image`)<br>*Un’immagine con didascalia* | **Schede**(`tabs`)<br>*Più viste nello stesso punto* | **Domanda aperta**(`openQuestion`)<br>*Qualcosa ancora non deciso* |
| **Incorporamento**(`embed`)<br>*Una pagina o una risorsa esterna* | **Pieghevole**(`collapsible`)<br>*Contenuto lungo e secondario, chiuso* | **Nota agente**(`agentNote`)<br>*Una nota per il modello; nascosta ai lettori per default* |
| **Appendice**(`appendix`)<br>*Materiale extra in fondo* | | |

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
