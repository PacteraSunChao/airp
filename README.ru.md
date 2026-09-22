# AIRP — AI Report Protocol

[🇺🇸 English](./README.md) | [🇨🇳 中文](./README.cn.md) | [🇯🇵 日本語](./README.ja.md) | [🇰🇷 한국어](./README.ko.md) | [🇩🇪 Deutsch](./README.de.md) | [🇫🇷 Français](./README.fr.md) | [🇷🇺 Русский](./README.ru.md) | [🇪🇸 Español](./README.es.md) | [🇧🇷 Português (Brasil)](./README.pt-BR.md) | [🇮🇹 Italiano](./README.it.md)

![AIRP screen capture](./screen-capture.png "AIRP screen capture")

**Чтобы отчёты от ИИ было проще читать—и проще править.**

Просишь у ИИ Markdown — часто выходит плоско и сбивчиво. HTML выглядит лучше, но длинный, жрёт токены и потом тяжело менять. Подход AIRP: сначала ИИ пишет источник `*.airp.json`, потом открываешь его расширением **AIRP Renderer** как аккуратный HTML. Нужно отправить наружу — экспортируешь HTML или Markdown.

Источник собран как **блоки (Blocks)** в духе Notion — сейчас их **46** (hero-метрики, сравнение, решение, таймлайн, Mermaid, обзор архитектуры и т.д.). У каждого свой макет: планы, ревью, ретро, аудиты читаются яснее и не слипаются в стену текста.

## Как крутится отчёт

Писать и читать — разные роли. `*.airp.json` посередине задан JSON Schema: и генерация, и проверка опираются на него:

| Кто | Что делает |
| --- | --- |
| **Skill `/airp`** | Даёт ИИ создать или править источник и валидирует его |
| **Расширение VS Code** | Читать в редакторе; экспорт HTML / Markdown |

Что это даёт на практике:

- Нет полей или разделов — валидация падает, меньше полуфабрикатов.
- Источник удобен для Git и diff; HTML / Markdown — просто то, что читают люди.
- Чёткие границы блоков стабильнее для модели и обычно дешевле по токенам, чем длинный HTML вручную.

## Быстрый старт

### 1. Поставить расширение VS Code

Установите **AIRP Renderer** из [Marketplace](https://marketplace.visualstudio.com/items?itemName=airp.airp-renderer-vscode) (ID: `airp.airp-renderer-vscode`).

Откройте любой `*.airp.json` — можно читать и экспортировать HTML / Markdown. Нужен редактор, совместимый с VS Code (например Cursor).

### 2. Поставить Skill `/airp`

Только открывать уже готовые источники — хватит расширения. Skill нужен, когда ИИ должен писать новые отчёты:

```bash
npx skills add maosong-ai/airp
```

В чате наберите `/airp <тема>`. Skill сгенерирует и проверит источник (папка по умолчанию: `.docs/airp/`). Дальше откройте файлом в расширении. По желанию: `--locale ru-RU`, `--out <каталог>`.

## Языки

Языки документов: English (`en-US`), 简体中文 (`zh-CN`), 日本語 (`ja-JP`), 한국어 (`ko-KR`), Deutsch (`de-DE`), Français (`fr-FR`), Русский (`ru-RU`), Español (`es-ES`), Português Brasil (`pt-BR`), Italiano (`it-IT`). При написании укажите `/airp --locale …`.

## Что дальше

Уже можно: Skill генерирует / проверяет источники; расширение читает и экспортирует HTML / Markdown. В планах:

| Направление | Коротко |
| --- | --- |
| **Визуальное редактирование** | Править в расширении, не бегая к Skill по каждому чиху |
| **Больше форматов экспорта** | Добавить PDF (печать, архив) |
| **Несколько страниц / листов** | Длинные отчёты резать по разделам или листам, а не пихать на одну страницу |

## Локальная разработка и сборка

Для тех, кто правит репозиторий. В обычной жизни расширение VS Code и Skill хватает — клонировать этот репозиторий не нужно.

Окружение: Node.js **20.19+**, pnpm **10.17+**.

```bash
pnpm install
```

**CLI валидации** (`airp-validate`)

```bash
# попробовать
pnpm validate-cli:sample

# сборка → apps/validate-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/validate-cli
```

**CLI рендера** (`airp-render`)

```bash
# попробовать
pnpm renderer-cli:sample

# сборка → apps/renderer-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/renderer-cli
```

**Расширение VS Code**

Откройте репозиторий в VS Code, F5 (или **Launch AIRP Renderer**) — отладка в Extension Development Host.

```bash
# сборка
pnpm exec turbo run build --filter=airp-renderer-vscode

# пакет → apps/renderer-vscode/dist/airp-renderer-vscode-<version>.vsix
pnpm --filter=airp-renderer-vscode package
```

---

## Лицензия

MIT

[AIRP](https://github.com/maosong-ai/airp) | Copyright (c) 2026 毛松 <maosong-life@outlook.com>
